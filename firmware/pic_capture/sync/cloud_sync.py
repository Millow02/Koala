import os
import tempfile
import subprocess
from typing import Optional
from loguru import logger
import sys

class CloudSync:
    """Class to handle cloud synchronization using rsync."""
    
    def __init__(self, hostname: str, ip_address: str, remote_folder: str, password: str):
        """Initialize CloudSync with connection details.
        
        Args:
            hostname (str): Username for the remote server
            ip_address (str): IP address of the remote server
            remote_folder (str): Default remote folder path
            password (str): SSH password for authentication
        """
        self.hostname = hostname
        self.ip_address = ip_address
        self.remote_folder = remote_folder
        self.password = password
        # Ensure logs directory exists
        os.makedirs("../logs", exist_ok=True)

        logger.add(
            "../logs/cloud_sync.log",
            rotation="10 MB",
            retention="1 week",
            level="INFO",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"
        )


    def sync_folder(self, source_folder: str, remote_folder: Optional[str] = None) -> bool:
        """Rsync a local folder to the remote server using SSH password authentication.
        
        Args:
            source_folder (str): Path to the local folder to sync
            remote_folder (str, optional): Override default remote folder path
            
        Returns:
            bool: True if successful, False otherwise
        """
        # Use default remote folder if none specified
        remote_folder = remote_folder or self.remote_folder
        
        # Ensure source folder ends with trailing slash to copy contents
        if not source_folder.endswith('/'):
            source_folder += '/'
        
        try:
            # Create temporary file for password
            with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp:
                temp_path = temp.name
                temp.write(self.password)
            
            # Set secure permissions on password file
            os.chmod(temp_path, 0o600)
            
            cmd = [
                "sshpass", "-f", temp_path,
                "rsync", "-avz", "--progress",
                "-e", "ssh -o StrictHostKeyChecking=no",
                source_folder,
                f"{self.hostname}@{self.ip_address}:{remote_folder}"
            ]
            
            try:
                result = subprocess.run(
                    cmd,
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                logger.success("Rsync completed successfully")
                logger.info(result.stdout)
                return True
            except subprocess.CalledProcessError as e:
                logger.error(f"Rsync failed with error: {e}")
                logger.error(f"Error output: {e.stderr}")
                return False
            finally:
                # Remove temporary password file
                os.unlink(temp_path)
        
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            return False
