import React, { useState } from 'react';
import { getFullImageUrl, getTrainerInitials } from '../../utils/imageHelper';

const TrainerPhoto = ({ trainer, className = "w-full h-full object-cover object-center" }) => {
    const [imageError, setImageError] = useState(false);

    const photoUrl = trainer?.photo ? getFullImageUrl(trainer.photo) : null;
    const initials = getTrainerInitials(trainer?.name);

    if (imageError || !photoUrl) {
        return (
            <div className={`${className} flex items-center justify-center bg-[#E8DDD2]`}>
        <span className="text-lg font-serif font-bold text-[#8B6B4D]">
          {initials}
        </span>
            </div>
        );
    }

    return (
        <img
            src={photoUrl}
            alt={trainer?.name || 'Тренер'}
            className={className}
            onError={() => setImageError(true)}
        />
    );
};

export default TrainerPhoto;