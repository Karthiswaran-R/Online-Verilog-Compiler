#!/bin/bash

# Install Python 3 and pip if not already installed
echo "Installing Python and pip..."
apt-get update
apt-get install -y python3 python3-pip

# Install dependencies from requirements.txt
pip3 install -r requirements.txt
