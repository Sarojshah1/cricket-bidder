import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  roomId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  message: string;
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  roomId: { type: Schema.Types.ObjectId, ref: 'AuctionRoom', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
