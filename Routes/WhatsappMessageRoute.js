import e from "express";
import { MessageDone } from "../Controllers/WhatsappMessageController.js";

const router = e.Router();

router.get("/whatsapp-messages-done-list", MessageDone);

export default router;
