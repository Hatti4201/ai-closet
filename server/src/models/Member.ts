import { Schema, model } from "mongoose";
import { MEMBER_ROLES, MemberRole } from "./enums";
import { exposeStringId } from "./_id";

// Contract §1.2
export interface MemberDoc {
  _id: string; // exposed as `id` in JSON
  householdId: string;
  displayName: string;
  role?: MemberRole;
}

const MemberSchema = new Schema<MemberDoc>(
  {
    _id: { type: String, required: true },
    householdId: { type: String, required: true, index: true },
    displayName: { type: String, required: true },
    role: { type: String, enum: [...MEMBER_ROLES] },
  },
  { versionKey: false }
);

exposeStringId(MemberSchema);

export const Member = model<MemberDoc>("Member", MemberSchema);
