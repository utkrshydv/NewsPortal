const axios = require('axios');

// @desc    Verify news text across multiple models (Forwarder)
// @route   POST /api/verify-news
// @access  Public
const verifyNews = async (req, res) => {
  try {
    const { text, dataset = "welfake" } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'News text is required.' });
    }

    // Forward the request to the new Python ML Microservice
    const mlResponse = await axios.post('http://localhost:8000/predict', {
      text: text,
      dataset: dataset
    });

    // Send the multi-model prediction results back to React
    res.status(200).json(mlResponse.data);

  } catch (error) {
    console.error('Error forwarding to ML service:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'ML Microservice is offline. Ensure Python server is running on port 8000.' });
    }

    res.status(500).json({ message: 'An error occurred during verification.', error: error.message });
  }
};

module.exports = {
  verifyNews,
};
