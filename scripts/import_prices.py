"""Validate a permitted normalized CSV and create an immutable, versioned SQLite dataset.

No network requests. The supplied license note records the operator's provenance statement;
it does not grant or verify redistribution rights. This staging database is not automatically
activated in the app: exchange calendars and corporate actions must be reviewed first.
"""
import argparse
import csv
import datetime as dt
from decimal import Decimal, InvalidOperation
import hashlib
import json
import pathlib
import sqlite3

ROOT = pathlib.Path(__file__).resolve().parents[1]
MAX_SAFE_INTEGER = 9007199254740991

def minor_units(value):
    try:
        amount = Decimal(value) * 100
        if not amount.is_finite() or amount <= 0 or amount != amount.to_integral_value() or amount > MAX_SAFE_INTEGER:
            raise ValueError('Prices must be positive, safe, and have at most two decimal places')
        return int(amount)
    except InvalidOperation as error:
        raise ValueError('Invalid price') from error

def import_csv(csv_path, output, dataset_id, source, license_note, kind='historical'):
    if not dataset_id.strip() or not source.strip() or not license_note.strip():
        raise ValueError('Dataset ID, source, and license note are required')
    if kind not in ('historical', 'synthetic'):
        raise ValueError('Invalid dataset kind')
    catalog = {row['id']: row for row in json.loads((ROOT / 'src/data/instruments.json').read_text())}
    csv_path, output = pathlib.Path(csv_path), pathlib.Path(output)
    raw = csv_path.read_bytes()
    records, seen = [], set()
    with csv_path.open(newline='', encoding='utf-8-sig') as handle:
        reader = csv.DictReader(handle)
        required = {'instrument_id','date','open','high','low','close','volume'}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError('CSV requires instrument_id,date,open,high,low,close,volume')
        for row in reader:
            instrument = row['instrument_id']
            if instrument not in catalog:
                raise ValueError(f'Unknown instrument: {instrument}')
            date = dt.date.fromisoformat(row['date']).isoformat()
            if date != row['date']:
                raise ValueError('Use ISO YYYY-MM-DD dates')
            key = (instrument, date)
            if key in seen:
                raise ValueError(f'Duplicate instrument/date: {key}')
            seen.add(key)
            opening, high, low, close = [minor_units(row[key]) for key in ['open','high','low','close']]
            if not low <= min(opening,close) <= max(opening,close) <= high:
                raise ValueError(f'Inconsistent OHLC: {key}')
            if not row['volume'].isdigit() or int(row['volume']) > MAX_SAFE_INTEGER:
                raise ValueError('Volume must be a nonnegative safe integer')
            records.append((dataset_id,instrument,date,opening,high,low,close,int(row['volume'])))
    if not records:
        raise ValueError('Empty dataset')
    fingerprint = hashlib.sha256(raw).hexdigest()
    output.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(output)
    try:
        with connection:
            connection.execute('PRAGMA foreign_keys=ON')
            connection.execute('CREATE TABLE IF NOT EXISTS datasets(id TEXT PRIMARY KEY, kind TEXT NOT NULL, source TEXT NOT NULL, license_note TEXT NOT NULL, sha256 TEXT NOT NULL, replay_eligible INTEGER NOT NULL DEFAULT 0)')
            connection.execute('CREATE TABLE IF NOT EXISTS daily_prices(dataset_id TEXT REFERENCES datasets(id), instrument_id TEXT, date TEXT, open INTEGER, high INTEGER, low INTEGER, close INTEGER, volume INTEGER, PRIMARY KEY(dataset_id,instrument_id,date))')
            existing = connection.execute('SELECT sha256,source,license_note,kind FROM datasets WHERE id=?',(dataset_id,)).fetchone()
            if existing:
                if existing != (fingerprint,source,license_note,kind):
                    raise ValueError('Dataset version already exists with different content or metadata; choose a new ID')
                return {'dataset_id':dataset_id,'rows':len(records),'unchanged':True,'sha256':fingerprint}
            connection.execute('INSERT INTO datasets(id,kind,source,license_note,sha256) VALUES (?,?,?,?,?)',(dataset_id,kind,source,license_note,fingerprint))
            connection.executemany('INSERT INTO daily_prices VALUES (?,?,?,?,?,?,?,?)',sorted(records))
        return {'dataset_id':dataset_id,'rows':len(records),'unchanged':False,'sha256':fingerprint}
    finally:
        connection.close()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--csv',required=True)
    parser.add_argument('--output',required=True)
    parser.add_argument('--dataset-id',required=True)
    parser.add_argument('--source',required=True)
    parser.add_argument('--license-note',required=True)
    parser.add_argument('--kind',choices=['historical','synthetic'],default='historical')
    args=parser.parse_args()
    print(json.dumps(import_csv(args.csv,args.output,args.dataset_id,args.source,args.license_note,args.kind),indent=2))

if __name__=='__main__':
    main()
