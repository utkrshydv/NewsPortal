const corsOptions = {
  origin: '*', // For development purposes. In production, restrict this to the frontend URL.
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = corsOptions;
