import { cache } from "react";
import { listInquiries } from "./inquiries";

/** The inbox, read once per request however many components ask for it. */
export const getInbox = cache(listInquiries);
