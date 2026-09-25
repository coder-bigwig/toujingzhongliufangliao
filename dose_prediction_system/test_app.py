import unittest

from app import app


class DoseServiceTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_home_and_metadata_load_without_model(self):
        self.assertEqual(self.client.get('/').status_code, 200)
        response = self.client.get('/api/meta')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['patients_by_split']['train'], [])
        self.assertEqual(data['checkpoint_options'], [])

    def test_inference_rejects_missing_checkpoint(self):
        response = self.client.post('/api/run-inference', data={
            'split': 'validation', 'patient_id': 'pt_1', 'checkpoint_path': 'missing.pt',
        })
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json()['code'], 'MODEL_UNAVAILABLE')

    def test_unknown_job_is_not_fabricated(self):
        self.assertEqual(self.client.get('/api/jobs/example').status_code, 404)


if __name__ == '__main__':
    unittest.main()
