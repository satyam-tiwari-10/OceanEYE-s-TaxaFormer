"""
Kaggle Worker - Handles communication with Kaggle ngrok server
"""
import os
import json
import time
import requests
from typing import Optional


class KaggleWorker:
    """Manages communication with Kaggle analysis server via ngrok"""
    
    def __init__(self, ngrok_url: Optional[str] = None):
        """
        Initialize Kaggle worker
        
        Args:
            ngrok_url: Ngrok URL of Kaggle server (e.g., https://xxx.ngrok-free.dev)
        """
        self.ngrok_url = ngrok_url or os.getenv("KAGGLE_NGROK_URL", "")
        self.timeout = int(os.getenv("KAGGLE_TIMEOUT", "300"))  # 5 minutes default
    
    def is_configured(self) -> bool:
        """Check if Kaggle ngrok URL is configured"""
        return bool(self.ngrok_url)
    
    def process_file(self, filepath: str, original_filename: str) -> dict:
        """
        Send file to Kaggle ngrok server for processing and retrieve results
        
        Args:
            filepath: Path to FASTA file
            original_filename: Original filename
            
        Returns:
            dict: Analysis results as JSON
        """
        if not self.is_configured():
            print(f"⚠️  Kaggle ngrok URL not configured, using mock data")
            return self._generate_mock_result(original_filename)
        
        try:
            print(f"📤 Sending {original_filename} to Kaggle server: {self.ngrok_url}")
            
            # Prepare file for upload
            with open(filepath, 'rb') as f:
                files = {'file': (original_filename, f, 'application/octet-stream')}
                
                # Send to Kaggle server
                response = requests.post(
                    f"{self.ngrok_url}/analyze",
                    files=files,
                    timeout=self.timeout,
                    headers={
                        'ngrok-skip-browser-warning': 'true'  # Skip ngrok warning page
                    }
                )
            
            # Check response
            if response.status_code != 200:
                error_msg = f"Kaggle server error: {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                raise Exception(error_msg)
            
            # Parse JSON response
            result = response.json()
            
            # Extract data from response
            if result.get('status') == 'success':
                print(f"✅ Received results from Kaggle server")
                return result.get('data', result)
            else:
                raise Exception(f"Kaggle server returned error: {result.get('message', 'Unknown error')}")
                
        except requests.exceptions.Timeout:
            print(f"⏱️  Kaggle server timeout after {self.timeout}s")
            raise Exception(f"Analysis timeout - file may be too large or server is busy")
        
        except requests.exceptions.ConnectionError:
            print(f"❌ Cannot connect to Kaggle server: {self.ngrok_url}")
            raise Exception(f"Cannot connect to Kaggle server - check ngrok URL and server status")
        
        except Exception as e:
            print(f"❌ Kaggle processing error: {e}")
            raise
    
    def _generate_mock_result(self, filename: str) -> dict:
        """Generate mock analysis result for testing"""
        return {
            "metadata": {
                "sampleName": filename,
                "totalSequences": 150,
                "processingTime": "2.8s",
                "avgConfidence": 89
            },
            "taxonomy_summary": [
                {"name": "Alveolata", "value": 45, "color": "#22D3EE"},
                {"name": "Chlorophyta", "value": 32, "color": "#10B981"},
                {"name": "Fungi", "value": 15, "color": "#A78BFA"},
                {"name": "Metazoa", "value": 28, "color": "#F59E0B"},
                {"name": "Rhodophyta", "value": 18, "color": "#EC4899"},
                {"name": "Unknown", "value": 12, "color": "#64748B"}
            ],
            "sequences": [
                {
                    "accession": "SEQ_001",
                    "taxonomy": "Alveolata; Dinoflagellata; Gymnodiniales",
                    "length": 1842,
                    "confidence": 0.94,
                    "overlap": 87,
                    "cluster": "C1"
                },
                {
                    "accession": "SEQ_002",
                    "taxonomy": "Chlorophyta; Chlorophyceae; Chlamydomonadales",
                    "length": 1654,
                    "confidence": 0.89,
                    "overlap": 92,
                    "cluster": "C2"
                },
                {
                    "accession": "SEQ_003",
                    "taxonomy": "Metazoa; Arthropoda; Copepoda",
                    "length": 2103,
                    "confidence": 0.96,
                    "overlap": 94,
                    "cluster": "C3"
                },
                {
                    "accession": "SEQ_004",
                    "taxonomy": "Unknown; Novel Cluster A",
                    "length": 1723,
                    "confidence": 0.42,
                    "overlap": 34,
                    "cluster": "N1"
                },
                {
                    "accession": "SEQ_005",
                    "taxonomy": "Rhodophyta; Florideophyceae; Ceramiales",
                    "length": 1889,
                    "confidence": 0.91,
                    "overlap": 88,
                    "cluster": "C4"
                }
            ],
            "cluster_data": [
                {"x": 12.5, "y": 8.3, "z": 45, "cluster": "Alveolata", "color": "#22D3EE"},
                {"x": -8.2, "y": 15.1, "z": 32, "cluster": "Chlorophyta", "color": "#10B981"},
                {"x": 3.4, "y": -12.7, "z": 28, "cluster": "Metazoa", "color": "#F59E0B"},
                {"x": -15.8, "y": -5.2, "z": 18, "cluster": "Rhodophyta", "color": "#EC4899"},
                {"x": 18.3, "y": 2.1, "z": 15, "cluster": "Fungi", "color": "#A78BFA"},
                {"x": -2.1, "y": -18.5, "z": 12, "cluster": "Unknown", "color": "#64748B"}
            ]
        }
    
    def check_server_health(self) -> bool:
        """
        Check if Kaggle server is online and responding
        
        Returns:
            bool: True if server is healthy
        """
        if not self.is_configured():
            return False
        
        try:
            response = requests.get(
                f"{self.ngrok_url}/health",
                timeout=10,
                headers={'ngrok-skip-browser-warning': 'true'}
            )
            return response.status_code == 200
        except:
            return False
    
    def get_server_info(self) -> dict:
        """
        Get information about Kaggle server
        
        Returns:
            dict: Server information
        """
        if not self.is_configured():
            return {"status": "not_configured"}
        
        try:
            response = requests.get(
                f"{self.ngrok_url}/",
                timeout=10,
                headers={'ngrok-skip-browser-warning': 'true'}
            )
            if response.status_code == 200:
                return response.json()
            return {"status": "error", "code": response.status_code}
        except Exception as e:
            return {"status": "error", "message": str(e)}
