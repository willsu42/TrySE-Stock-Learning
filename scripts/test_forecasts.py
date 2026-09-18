import unittest
try:
    from train_forecasts import predict
except ImportError:
    predict = None

@unittest.skipIf(predict is None, 'Install scripts/requirements.txt to run model tests')
class ForecastTests(unittest.TestCase):
    def test_future_prices_do_not_change_prediction(self):
        values=[10000+(i*37)%800 for i in range(250)]
        for horizon in [1,5]:
            before=predict(values,200,horizon)
            changed=values[:201]+[90000000]*49
            self.assertEqual(before,predict(changed,200,horizon))
    def test_insufficient_history_rejected(self):
        with self.assertRaises(ValueError):predict([100]*12,10,5)
    def test_constant_series(self):
        self.assertEqual(predict([10000]*250,200,5),10000)
