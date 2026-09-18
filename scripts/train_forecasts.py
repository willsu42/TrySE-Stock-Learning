"""Generate a reproducible ridge-regression replay model from prior observations only."""
import json
import pathlib
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

ROOT = pathlib.Path(__file__).resolve().parents[1]
MODEL_VERSION = 'ridge-lag5-v1'

def predict(closes, cutoff, horizon):
    # Rows end at cutoff; even training labels must be known at cutoff.
    values = np.asarray(closes[:cutoff + 1], dtype=float)
    returns = np.diff(values) / values[:-1]
    x, y = [], []
    for i in range(max(5, cutoff - 180), cutoff - horizon + 1):
        x.append(returns[i-5:i])
        y.append(values[i+horizon] / values[i] - 1)
    if len(x) < 20:
        raise ValueError('Not enough prior training samples')
    model = make_pipeline(StandardScaler(), Ridge(alpha=10.0))
    model.fit(np.asarray(x), np.asarray(y))
    forecast_return = float(model.predict(returns[-5:].reshape(1, -1))[0])
    return max(1, round(values[-1] * (1 + forecast_return)))

def main():
    data = json.loads((ROOT / 'src/data/demo-prices.json').read_text())
    output = []
    for instrument_id, rows in data['series'].items():
        closes = [row['close'] for row in rows]
        # The lab uses a separate 2025 period from the 2024 trading exercises.
        cutoffs = [i for i, row in enumerate(rows) if '2025-01-02' <= row['date'] <= '2025-03-31'][::5]
        for cutoff in cutoffs:
            for horizon in [1, 5]:
                output.append({'instrumentId': instrument_id, 'cutoff': rows[cutoff]['date'], 'target': rows[cutoff+horizon]['date'], 'horizon': horizon, 'baseline': closes[cutoff], 'prediction': predict(closes, cutoff, horizon), 'modelVersion': MODEL_VERSION, 'datasetId': data['id']})
    (ROOT / 'src/data/forecasts.json').write_text(json.dumps(output, separators=(',', ':')) + '\n')
    print(f'Generated {len(output)} forecasts; targets excluded from model inputs.')

if __name__ == '__main__':
    main()
