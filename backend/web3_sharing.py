"""Mock Web3 integration for decentralized threat intelligence sharing."""

import hashlib
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class Web3Mock:
    def __init__(self):
        self.network = "Testnet (Mock)"
        self.contract_address = "0x" + "1234abcd" * 10
        self.published_events = []

    def anonymize_data(self, node_info: dict, vuln_info: dict) -> dict:
        """Strip identifiable information like IP addresses and hostnames."""
        # We only want to share what service is vulnerable, the CVE, and the OS
        return {
            "cve_id": vuln_info.get("cve_id"),
            "cvss_score": vuln_info.get("cvss_v3"),
            "service": vuln_info.get("affected_service"),
            "os_family": node_info.get("os", "unknown"),
            "timestamp": datetime.utcnow().isoformat()
        }

    def generate_hash(self, data: dict) -> str:
        """Generate a SHA-256 hash of the payload to simulate blockchain transaction hash."""
        serialized = json.dumps(data, sort_keys=True).encode("utf-8")
        return "0x" + hashlib.sha256(serialized).hexdigest()

    def mock_publish(self, data: dict) -> dict:
        """Simulate publishing the anonymized threat data to a Web3 smart contract."""
        tx_hash = self.generate_hash(data)
        
        event = {
            "transaction_hash": tx_hash,
            "contract": self.contract_address,
            "network": self.network,
            "payload": data,
            "status": "confirmed",
            "block_number": 14502341 + len(self.published_events)
        }
        
        self.published_events.append(event)
        logger.info(f"Published threat intelligence to Web3 mock: {tx_hash}")
        
        return event

# Global instance for the FastAPI app
web3_client = Web3Mock()
