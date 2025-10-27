import cors from 'cors';

export const corsOptions = {
  origin: '*', // Cambia esto por el dominio de tu frontend en producción
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default cors(corsOptions);
