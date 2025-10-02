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
    // origin: "*", // your React app URL
    origin: [
      "https://68da870ab842ae523a1b368c--capable-bubblegum-c45fb0.netlify.app",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // ✅ allow cookies / auth headers
  })
);


// ✅ Handle OPTIONS requests
app.options("*", cors());

app.use(e.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/users", UserRoutes);
app.use("/api/whatsapp", WhatsAppRoutes);

const PORT = process.env.PORT ?? 5000;

app.listen(PORT, () => {
  // console.log(`server is started on port:http://localhost:${PORT}`);
  console.log(`server is started on port:https://68da870ab842ae523a1b368c--capable-bubblegum-c45fb0.netlify.app:${PORT}`);
});
