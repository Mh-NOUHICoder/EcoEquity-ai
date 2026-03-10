"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

const EcoNeuralBackground = () => {
    const [init, setInit] = useState(false);

    // Initializing the particles engine
    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const options: ISourceOptions = useMemo(
        () => ({
            background: {
                color: {
                    value: "transparent",
                },
            },
            fpsLimit: 120,
            interactivity: {
                events: {
                    onHover: {
                        enable: true,
                        mode: "grab",
                    },
                },
                modes: {
                    grab: {
                        distance: 200,
                        links: {
                            opacity: 0.5,
                        },
                    },
                },
            },
            particles: {
                color: {
                    value: "#10b981", // Emerald Green
                },
                links: {
                    color: "#10b981",
                    distance: 180,
                    enable: true,
                    opacity: 0.4,
                    width: 1.5,
                },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: {
                        default: "out",
                    },
                    random: true,
                    speed: 0.8, // Slow and calm
                    straight: false,
                },
                number: {
                    density: {
                        enable: true,
                        area: 800,
                    },
                    value: 120,
                },
                opacity: {
                    value: { min: 0.1, max: 0.4 }, // Subtle twinkle
                    animation: {
                        enable: true,
                        speed: 1,
                        sync: false,
                    },
                },
                shape: {
                    type: "circle",
                },
                size: {
                    value: { min: 1, max: 3 }, // Small particles
                },
            },
            detectRetina: true,
            fullScreen: {
                enable: true,
                zIndex: 1,
            },
        }),
        []
    );

    if (init) {
        return (
            <Particles
                id="tsparticles"
                className="pointer-events-none"
                options={options}
            />
        );
    }

    return null;
};

export default EcoNeuralBackground;
