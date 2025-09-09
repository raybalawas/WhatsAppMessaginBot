import { configDotenv } from "dotenv";
configDotenv();
import e from "express";
import connectDB from "./utils/db.js";
connectDB();
import UserRoutes from "./Routes/UserRoute.js";
import cors from "cors";
import bodyParser from "body-parser";
import WhatsAppRoutes from "./Routes/WhatsappMessageRoute.js";

const app = e();
app.use(e.json());

app.use(
  cors({
    // origin: "http://localhost:5173",
    origin: "*", // your React app URL
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // ✅ allow cookies / auth headers
  })
);

app.use(e.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/users", UserRoutes);
app.use("/api/whatsapp", WhatsAppRoutes);

const PORT = process.env.PORT ?? 5000;

app.listen(PORT, () => {
  console.log(`server is started on port:http://localhost:${PORT}`);
});
