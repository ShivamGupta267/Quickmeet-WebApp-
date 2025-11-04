
import { Router } from "express";
import { signup ,login , getMe, addToHistory, getUserHistory} from "../controllers/userControllers.js";
import { protect } from "../middleware/authMiddleware.js";


const router = Router();

router.route( "/login").post(login)
router.route( "/signup").post(signup)
router.route("/me").get(protect, getMe);
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getUserHistory)


export default router;
