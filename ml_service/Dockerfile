FROM python:3.11-slim

# Install system dependencies required for ML libraries like LightGBM
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgomp1 && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root user with ID 1000 (Required for Hugging Face Spaces)
RUN useradd -m -u 1000 user

# Switch to the non-root user
USER user

# Set environment variables
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Change working directory to the user's home directory
WORKDIR $HOME/app

# Copy all files from ml_service into the container and set ownership to 'user'
COPY --chown=user . $HOME/app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the standard port for Hugging Face Spaces
EXPOSE 7860

# Command to run the FastAPI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
