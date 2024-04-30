import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
    subscriber: mongoose.Schema.Types.ObjectId;
    channel: mongoose.Schema.Types.ObjectId;
}

const subscriptionSchema = new Schema<ISubscription>(
    {
        subscriber: {
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
