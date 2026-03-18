import express from "express";
import userRoutes from "./routes/user-route";
import taskRoutes from "./routes/task-route";
import authRoute from "./routes/auth-route";
import errorMiddleware from "./middlewares/error-middleware";
const app = express();

app.use(express.json());
app.use("/users", userRoutes);
app.use("/tasks", taskRoutes);
app.use("/auth", authRoute);
app.use(errorMiddleware);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor em execução na porta ${PORT}`);
});
