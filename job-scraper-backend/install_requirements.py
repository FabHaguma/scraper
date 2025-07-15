# install_requirements.py - Install required packages for enhanced scraping

import subprocess
import sys

def install_package(package):
    """Install a package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {package}: {e}")
        return False

if __name__ == "__main__":
    packages_to_install = [
        "fake-useragent",  # For rotating user agents
        "requests[socks]", # For proxy support
    ]
    
    print("Installing packages for enhanced scraping...")
    
    for package in packages_to_install:
        install_package(package)
    
    print("\nAll packages installed! You can now use the enhanced scraper.")
