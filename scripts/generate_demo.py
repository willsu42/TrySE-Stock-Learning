"""Create reproducible fictional OHLCV. Never downloaded or represented as market data."""
import datetime as dt
import hashlib
import json
import pathlib
import random

ROOT = pathlib.Path(__file__).resolve().parents[1]

def build():
    instruments = json.loads((ROOT / 'src/data/instruments.json').read_text())
    dates = []
    date = dt.date(2023, 1, 2)
    while date <= dt.date(2025, 12, 31):
        if date.weekday() < 5:
            dates.append(date.isoformat())
        date += dt.timedelta(days=1)
    series = {}
    for stock in instruments:
        rng = random.Random(stock['id'] + ':tryse-demo-v1')
        previous = stock['seedPrice']
        rows = []
        for date in dates:
            opening = max(100, round(previous * (1 + rng.uniform(-.007, .007))))
            close = max(100, round(opening * (1 + rng.uniform(-.023, .024))))
            high = max(opening, close) + rng.randint(1, max(2, opening // 100))
            low = max(1, min(opening, close) - rng.randint(1, max(2, opening // 100)))
            rows.append({'date': date, 'open': opening, 'high': high, 'low': low, 'close': close, 'volume': rng.randint(100_000, 15_000_000)})
            previous = close
        series[stock['id']] = rows
    data = {'id': 'synthetic-v1', 'kind': 'synthetic', 'source': 'TrySE seeded demo generator; no market-data provider', 'calendar': 'Fictional weekday sessions, NOT exchange calendars', 'priceScale': 100, 'series': series}
    output = ROOT / 'src/data/demo-prices.json'
    output.write_text(json.dumps(data, separators=(',', ':')) + '\n')
    print(f'{len(instruments)} instruments, {len(dates)} fictional sessions each; {output.stat().st_size:,} bytes; SHA256 {hashlib.sha256(output.read_bytes()).hexdigest()}')

if __name__ == '__main__':
    build()
