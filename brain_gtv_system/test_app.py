import unittest
from pathlib import Path

from app import app


class ContouringServiceTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_home_and_metadata_load_without_model(self):
        self.assertEqual(self.client.get('/').status_code, 200)
        response = self.client.get('/api/meta')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['case_count'], 0)
        self.assertEqual(data['model_count'], 0)
        self.assertEqual(data['cases'], [])
        self.assertEqual(data['profiles'], [])

    def test_inference_rejects_missing_model(self):
        response = self.client.post('/api/run-case', data={'case_id': '101', 'profile_id': 'balanced_v1'})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json()['code'], 'MODEL_UNAVAILABLE')

    def test_revision_missing_result_is_not_fabricated(self):
        self.assertEqual(self.client.get('/api/revision/example').status_code, 404)

    def test_archived_overlay_is_available_as_previous_result(self):
        response = self.client.get('/api/meta')
        summary = response.get_json()['latest_result_summary']
        archived_image = Path(__file__).resolve().parent / 'outputs' / 'web' / '700_0704728_balanced_v1_96f10bda' / 'overlay.png'
        if not archived_image.is_file():
            self.assertIsNone(summary)
            return
        self.assertIsNotNone(summary)
        self.assertEqual(summary['result_name'], '700_0704728_balanced_v1_96f10bda')
        image = self.client.get(summary['overlay_url'])
        self.assertEqual(image.status_code, 200)
        self.assertEqual(image.mimetype, 'image/png')
        image.close()

    def test_archived_slices_are_read_only_and_match_the_result(self):
        name = '700_0704728_balanced_v1_96f10bda'
        available = (Path(__file__).resolve().parent / 'archived-slices' / name / 'meta.json').is_file()
        summary = self.client.get('/api/meta').get_json()['latest_result_summary']
        if not available:
            self.assertFalse(summary and summary['archive_slices_available'])
            self.assertEqual(self.client.get(f'/api/revision/{name}').status_code, 404)
            return
        self.assertTrue(summary['archive_slices_available'])
        meta = self.client.get(f'/api/revision/{name}')
        self.assertEqual(meta.status_code, 200)
        self.assertEqual(meta.get_json()['slice_count'], 22)
        slice_response = self.client.get(f'/api/revision/{name}/slice/3')
        self.assertEqual(slice_response.status_code, 200)
        slice_data = slice_response.get_json()
        self.assertEqual(slice_data['z'], 3)
        self.assertEqual(len(slice_data['image']), slice_data['height'])
        self.assertEqual(len(slice_data['mask']), slice_data['height'])
        self.assertEqual(self.client.get(f'/api/revision/{name}/slice/22').status_code, 404)
        self.assertEqual(self.client.get('/api/revision/another/slice/3').status_code, 404)
        self.assertEqual(self.client.post(f'/api/revision/{name}/save').status_code, 404)


if __name__ == '__main__':
    unittest.main()
