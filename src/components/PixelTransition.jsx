import React, { useState, useEffect } from 'react';
import styles from './style.module.css';
import { motion } from 'framer-motion';

const anim = {
    initial: {
        opacity: 1,
        scale: 1 // Starts fully opaque (covering screen when route mounts)
    },
    enter: (delay) => ({
        opacity: 0,
        scale: 0.5, // Pop away shrinking (uncovers the page)
        transition: { duration: 0.2, delay: 0.02 * delay[0], ease: "backIn" }
    }),
    exit: (delay) => ({
        opacity: 1,
        scale: 1, // Pop in expanding (covers the screen before unmounting)
        transition: { duration: 0.2, delay: 0.02 * delay[1], ease: "backOut" }

    })
};

export default function PixelTransition({ children }) {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const getBlocks = (rowIndex) => {
        const { width, height } = dimensions;

        const blockSize = height * 0.1;
        const nbOfBlocks = Math.ceil(width / blockSize);
        const indexes = Array.from({ length: nbOfBlocks }, (_, i) => i);

        return indexes.map((colIndex, index) => {
            // A deterministic alternating matrix to create highly scattered pixel art transitions.
            // By utilizing modulo on the indexes, we generate a chaotic, jagged "checkerboard" structure
            const pixelationJitter = ((rowIndex * 7 + colIndex * 13) % 5);

            // ✅ Enter sweep goes Top-to-Bottom
            const enterDelay = rowIndex * 2.5 + pixelationJitter;

            // ✅ Exit sweep correctly reverses Bottom-to-Top
            const exitDelay = (9 - rowIndex) * 2.5 + pixelationJitter;

            return (
                <motion.div
                    key={index}
                    className={styles.block} // Maintained your module CSS hook
                    style={{ backgroundColor: '#748F44' }} // ✅ Applied your specific olive color inline directly to the block
                    variants={anim}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                    custom={[enterDelay, exitDelay]} // Driven natively by React Router AnimatePresence implicitly passed delays!
                />
            )
        })
    }

    return (
        <>
            {/* 1. We mount the normal page content beneath the pixels */}
            {children}

            {/* 2. We render the overlay grid of boxes that animate opacity on top */}
            {dimensions.width > 0 && (
                <div className={styles.pixelBackground}>
                    {
                        Array.from({ length: 10 }).map((_, index) => {
                            return (
                                <div key={index} className={styles.row}>
                                    {getBlocks(index)}
                                </div>
                            )
                        })
                    }
                </div>
            )}
        </>
    )
}
