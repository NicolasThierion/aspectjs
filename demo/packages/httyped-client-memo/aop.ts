import { getWeaver } from "@aspectjs/core";
import { MemoAspect } from "@aspectjs/memo";

getWeaver().enable(new MemoAspect());
