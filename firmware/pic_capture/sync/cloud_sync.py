import os
import tempfile
import subprocess
from typing import Optional
from loguru import logger

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

    def test_connection(self) -> bool:
        """Test connection to remote server using SSH.
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            # Create temporary file for password
            with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp:
                temp_path = temp.name
                temp.write(self.password)
            
            # Set secure permissions on password file
            os.chmod(temp_path, 0o600)
            
            cmd = [
                "sshpass", "-f", temp_path,
                "ssh", "-o", "StrictHostKeyChecking=no",
                f"{self.hostname}@{self.ip_address}",
                "echo 'Connection test successful'"
            ]
            
            try:
                result = subprocess.run(
                    cmd,
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=5  # 5 second timeout
                )
                logger.success("Connection test successful")
                return True
            except subprocess.CalledProcessError as e:
                logger.error(f"Connection test failed with error: {e}")
                logger.error(f"Error output: {e.stderr}")
                return False
            finally:
                # Remove temporary password file
                os.unlink(temp_path)
                
        except Exception as e:
            logger.error(f"Connection test error: {str(e)}")
            return False

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
