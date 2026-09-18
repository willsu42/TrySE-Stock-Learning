import pathlib
import sqlite3
import tempfile
import unittest
from import_prices import import_csv, minor_units

class ImportTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.csv=pathlib.Path(self.tmp.name)/'prices.csv'
        self.db=pathlib.Path(self.tmp.name)/'prices.db'
        self.header='instrument_id,date,open,high,low,close,volume\n'
        self.row='TW:2330,2024-01-02,100.10,102.20,99.90,101.20,1000\n'
        self.csv.write_text(self.header+self.row)
    def run_import(self):
        return import_csv(self.csv,self.db,'fixture-v1','Synthetic test','Authored fixture','synthetic')
    def test_exact_money(self):
        self.assertEqual(minor_units('0.29'),29)
        for value in ['NaN','Infinity','-1','0','1.001']:
            with self.assertRaises(ValueError):minor_units(value)
    def test_repeatable_and_ineligible_until_review(self):
        self.assertFalse(self.run_import()['unchanged'])
        self.assertTrue(self.run_import()['unchanged'])
        with sqlite3.connect(self.db) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM daily_prices').fetchone()[0],1)
            self.assertEqual(db.execute('SELECT close FROM daily_prices').fetchone()[0],10120)
            self.assertEqual(db.execute('SELECT replay_eligible FROM datasets').fetchone()[0],0)
    def test_duplicate_rejected_before_write(self):
        self.csv.write_text(self.header+self.row+self.row)
        with self.assertRaises(ValueError):self.run_import()
        self.assertFalse(self.db.exists())
    def test_invalid_data(self):
        for row in [self.row.replace('102.20','98.00'),self.row.replace('TW:2330','UNKNOWN'),self.row.replace('2024-01-02','2024-02-30'),self.row.replace(',1000',',1.5')]:
            self.csv.write_text(self.header+row)
            with self.assertRaises(ValueError):self.run_import()
    def test_correction_needs_new_version(self):
        self.run_import()
        self.csv.write_text(self.header+self.row.replace('101.20','101.30'))
        with self.assertRaises(ValueError):self.run_import()
        with sqlite3.connect(self.db) as db:
            self.assertEqual(db.execute('SELECT close FROM daily_prices').fetchone()[0],10120)

if __name__=='__main__':unittest.main()
