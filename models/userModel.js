// models/userModel.js — NeDB users; passwords stored as bcrypt hashes only
import { usersDb } from "./_db.js";
import { normalizeEmail } from "../utils/normalizeEmail.js";

export const UserModel = {
  async create(user) {
    const doc = { ...user };
    if (doc.email != null) doc.email = normalizeEmail(doc.email);
    return usersDb.insert(doc);
  },
  async findByEmail(email) {
    const key = normalizeEmail(email);
    if (!key) return null;
    return usersDb.findOne({ email: key });
  },
  async findById(id) {
    if (id == null) return null;
    return usersDb.findOne({ _id: id });
  },
  async list() {
    return usersDb.find({});
  },
  async update(id, patch) {
    await usersDb.update({ _id: id }, { $set: patch });
    return this.findById(id);
  },
  async remove(id) {
    await usersDb.remove({ _id: id });
  },
  async countByRole(role) {
    return usersDb.count({ role });
  },
};
