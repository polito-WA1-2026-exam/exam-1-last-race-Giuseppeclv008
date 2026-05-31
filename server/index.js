// imports
import express from "express";
import morgan from "morgan";
import cors from "cors";
import { sessionMiddleware, passport } from "./lib/auth";
import sessionRoutes from "./routes/sessionRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
// init express
const app = new express();
const PORT = 3001;
app.use(morgan("dev"));
app.use(express.json());
app.use(cors({origin: "http://localhost:5173", credentials: true}));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.use(sessionRoutes);
app.use(gameRoutes);

app.use((err, req, res, next) => { 
  console.error(err)
  res.status(500).json({ error: "Internal Server Error" });
});

// activate the server
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

export default app;