import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  subsriber: mongoose.Schema.Types.ObjectId;
  channel: mongoose.Schema.Types.ObjectId;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    subsriber: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    channel: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>(
  'Subscription',
  subscriptionSchema
);
