
// Removed import, relying on global window.calculateMaxAccel

const INITIAL_PARAMS = {
    wheelRadius: 0.0381,
    driveGearing: 5.143,
    maxDriveSpeed: 4.5,
    currentLimit: 40,
};

let params = { ...INITIAL_PARAMS };

// Elements
const sliders = {
    wheelRadius: document.getElementById('input-wheelRadius'),
    driveGearing: document.getElementById('input-driveGearing'),
    maxDriveSpeed: document.getElementById('input-maxDriveSpeed'),
    currentLimit: document.getElementById('input-currentLimit')
};

const labels = {
    wheelRadius: { val: document.getElementById('val-wheelRadius'), sec: document.getElementById('sec-wheelRadius') },
    driveGearing: { val: document.getElementById('val-driveGearing') },
    maxDriveSpeed: { val: document.getElementById('val-maxDriveSpeed'), sec: document.getElementById('sec-maxDriveSpeed') },
    currentLimit: { val: document.getElementById('val-currentLimit') }
};

const results = {
    maxAccel: document.getElementById('result-maxAccel'),
    maxAccelImp: document.getElementById('result-maxAccel-imperial'),
    limitingFactorCard: document.getElementById('card-limitingFactor'),
    limitingFactorTitle: document.getElementById('result-limitingFactor'),
    limitingFactorDesc: document.getElementById('text-limitingFactor')
};

const chart = {
    bar: document.getElementById('chart-bar'),
    tooltip: document.getElementById('chart-tooltip')
};

const vis = {
    ground: document.getElementById('vis-ground'),
    motorGroup: document.getElementById('vis-motor-group'),
    motorGear: document.getElementById('vis-motor-gear'),
    drivenGroup: document.getElementById('vis-driven-group'),
    drivenGear: document.getElementById('vis-driven-gear'),
    drivenCircle: document.getElementById('vis-driven-circle'),
    drivenInner: document.getElementById('vis-driven-inner'),
    drivenTeeth: document.getElementById('vis-driven-teeth'),
    drivenDot: document.getElementById('vis-driven-dot'),
    drivenCross: document.getElementById('vis-driven-cross'),
    axle: document.getElementById('vis-axle'),
    wheelGroup: document.querySelector('#vis-wheel-rotator'),
    sparks: document.getElementById('vis-sparks'),
    hudStatus: document.getElementById('hud-status'),
    hudLimit: document.getElementById('hud-limit'),
    stallWarning: document.getElementById('stall-warning'),
    hudRatio: document.getElementById('hud-ratio'),
    hudVelocity: document.getElementById('hud-velocity'),
};

// Listeners
if (sliders.wheelRadius) {
    Object.keys(sliders).forEach(key => {
        if (sliders[key]) {
            sliders[key].addEventListener('input', (e) => {
                params[key] = parseFloat(e.target.value);
                updateUI();
            });
        }
    });
}

function createTeeth(radius, count, color) {
    // Clear existing
    if (vis.drivenTeeth) {
        vis.drivenTeeth.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * 360;
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", "-1.5");
            rect.setAttribute("y", -radius - 4);
            rect.setAttribute("width", "3");
            rect.setAttribute("height", "6");
            rect.setAttribute("fill", color);
            rect.setAttribute("transform", `rotate(${angle})`);
            vis.drivenTeeth.appendChild(rect);
        }
    }
}

function updateUI() {
    if (typeof window.calculateMaxAccel !== 'function') {
        console.error("calculateMaxAccel not found");
        return;
    }
    const result = window.calculateMaxAccel(params);

    // 1. Update Sliders & Labels
    if (labels.wheelRadius.val) labels.wheelRadius.val.textContent = `${params.wheelRadius.toFixed(3)}m`;
    if (labels.wheelRadius.sec) labels.wheelRadius.sec.textContent = `(${(params.wheelRadius * 39.3701).toFixed(1)}in)`;

    if (labels.driveGearing.val) labels.driveGearing.val.textContent = `${params.driveGearing.toFixed(2)}:1`;

    if (labels.maxDriveSpeed.val) labels.maxDriveSpeed.val.textContent = `${params.maxDriveSpeed.toFixed(1)}m/s`;
    if (labels.maxDriveSpeed.sec) labels.maxDriveSpeed.sec.textContent = `(${(params.maxDriveSpeed * 3.28084).toFixed(1)}ft/s)`;

    if (labels.currentLimit.val) labels.currentLimit.val.textContent = `${params.currentLimit.toFixed(1)}A`;

    // 2. Update Results
    if (results.maxAccel) results.maxAccel.textContent = result.maxAccel.toFixed(2);
    if (results.maxAccelImp) results.maxAccelImp.textContent = `(${(result.maxAccel * 3.28084).toFixed(1)} ft/s²)`;

    if (results.limitingFactorTitle) results.limitingFactorTitle.textContent = result.limitingFactor;

    // Reset card classes
    if (results.limitingFactorCard) {
        results.limitingFactorCard.className = `p-12 rounded-[2.5rem] border-2 transition-all shadow-sm flex flex-col justify-center ${result.limitingFactor === 'Traction' ? 'bg-amber-50 border-amber-300' :
            result.limitingFactor === 'Current Limit' ? 'bg-indigo-50 border-indigo-200' :
                'bg-emerald-50 border-emerald-200'
            }`;
    }

    if (results.limitingFactorDesc) {
        results.limitingFactorDesc.textContent =
            result.maxAccel <= 0 ? 'The motor cannot generate enough torque to overcome the load. The gearing might be too fast (low ratio) or the wheels too large.' :
                result.limitingFactor === 'Traction' ? 'Wheels are spinning. You have more torque than grip!' :
                    result.limitingFactor === 'Current Limit' ? 'Electronic caps are throttling motor performance.' :
                        'Motor torque is the primary limiting factor for this configuration.';
    }

    // 3. Update Chart
    if (chart.bar) {
        const maxChartVal = 16;
        const percentage = Math.min((result.maxAccel / maxChartVal) * 100, 100);
        chart.bar.style.height = `${percentage}%`;
        chart.bar.style.backgroundColor = result.maxAccel > 0 ? '#f59e0b' : '#e2e8f0';
    }
    if (chart.tooltip) {
        chart.tooltip.textContent = result.maxAccel.toFixed(2);
    }

    // 4. Update Visualization
    updateVisualization(result);
}

function updateVisualization(result) {
    // Consts
    const motorX = 80;
    const centerY = 100;
    const motorRadius = 15;
    const visWheelRadius = params.wheelRadius * 800;

    // Update Ground Line
    if (vis.ground) {
        vis.ground.setAttribute("y1", centerY + visWheelRadius);
        vis.ground.setAttribute("y2", centerY + visWheelRadius);
    }

    // Driven Gear Geometry
    const drivenGearRadius = Math.min(55, motorRadius * Math.sqrt(params.driveGearing));
    const drivenGearX = motorX + motorRadius + drivenGearRadius - 2;

    // Update transform of driven gear group
    if (vis.drivenGroup) vis.drivenGroup.setAttribute("transform", `translate(${drivenGearX}, ${centerY})`);

    // Update Driven Gear visuals
    if (vis.drivenCircle) vis.drivenCircle.setAttribute("r", drivenGearRadius);
    if (vis.drivenInner) vis.drivenInner.setAttribute("r", drivenGearRadius - 10);
    if (vis.drivenDot) vis.drivenDot.setAttribute("cx", drivenGearRadius - 8);
    if (vis.drivenCross) vis.drivenCross.setAttribute("d", `M -${drivenGearRadius} 0 L ${drivenGearRadius} 0 M 0 -${drivenGearRadius} L 0 ${drivenGearRadius}`);

    // Update Teeth
    const teethCount = Math.max(12, Math.floor(10 * Math.sqrt(params.driveGearing)));
    if (vis.drivenTeeth) {
        if (vis.drivenTeeth.getAttribute('data-count') != teethCount || vis.drivenTeeth.getAttribute('data-radius') != drivenGearRadius) {
            createTeeth(drivenGearRadius, teethCount, "currentColor");
            vis.drivenTeeth.setAttribute('data-count', teethCount);
            vis.drivenTeeth.setAttribute('data-radius', drivenGearRadius);
        }
    }

    // Update Axle
    if (vis.axle) vis.axle.setAttribute("x1", drivenGearX);

    // Animations - Using SVGs SMIL animations would be cool, but CSS keyframes are more robust usually.
    // The user asked "Can you use svg to animate it". This might mean they prefer SMIL or just that CSS wasn't working.
    // CSS working on SVG elements is standard. I'll stick to CSS but ensure it's applied.

    const motorTargetDuration = 0.6;
    const wheelTargetDuration = motorTargetDuration * params.driveGearing;

    // Helper to force reflow if needed, but usually just style update works.

    if (result.maxAccel <= 0) {
        if (vis.motorGear) vis.motorGear.style.animation = 'none';
        if (vis.drivenGear) vis.drivenGear.style.animation = 'none';
        if (vis.wheelGroup) vis.wheelGroup.style.animation = 'none';

        if (vis.hudStatus) {
            vis.hudStatus.textContent = "STATUS: STALLED";
            vis.hudStatus.className = "text-[11px] font-black font-mono px-4 py-2 rounded-xl border shadow-sm tracking-widest bg-rose-50 border-rose-200 text-rose-600";
        }
        if (vis.hudLimit) vis.hudLimit.classList.add('hidden');
        if (vis.stallWarning) vis.stallWarning.classList.remove('hidden');
    } else {
        // Motor
        if (vis.motorGear) {
            vis.motorGear.style.animation = `spin-gear ${motorTargetDuration}s linear infinite`;
        }

        // Hide warning if running
        if (vis.stallWarning) vis.stallWarning.classList.add('hidden');

        // Driven
        if (vis.drivenGear) {
            vis.drivenGear.style.animation = `spin-gear-reverse ${wheelTargetDuration}s linear infinite`;
        }

        // Wheel
        if (vis.wheelGroup) {
            vis.wheelGroup.style.animation = `spin-gear-reverse ${wheelTargetDuration}s linear infinite`;
        }

        // HUD
        if (vis.hudStatus) {
            vis.hudStatus.textContent = "STATUS: NOMINAL";
            vis.hudStatus.className = "text-[11px] font-black font-mono px-4 py-2 rounded-xl border shadow-sm tracking-widest bg-emerald-50 border-emerald-200 text-emerald-600";
        }

        // HUD Limit
        if (vis.hudLimit) {
            vis.hudLimit.classList.remove('hidden');
            vis.hudLimit.textContent = `${result.limitingFactor.toUpperCase()} LIMITED`;
            vis.hudLimit.className = `text-[11px] font-black font-mono px-4 py-2 rounded-xl border shadow-sm tracking-widest animate-pulse ${result.limitingFactor === 'Traction' ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`;
        }
    }

    // Sparks
    if (vis.sparks) {
        if (result.limitingFactor === 'Traction' && result.maxAccel > 0) {
            vis.sparks.style.display = 'block';
            vis.sparks.setAttribute('transform', `translate(${-visWheelRadius + 5}, ${visWheelRadius})`);
        } else {
            vis.sparks.style.display = 'none';
        }
    }

    // Update Wheel Visuals
    const tire = document.getElementById('vis-wheel-tire');
    const rim = document.getElementById('vis-wheel-rim');
    const spokes = document.getElementById('vis-wheel-spokes');

    if (tire) tire.setAttribute('r', visWheelRadius);
    if (rim) rim.setAttribute('r', visWheelRadius - 9);

    if (spokes) {
        const spokeLines = spokes.children;
        for (let line of spokeLines) {
            line.setAttribute('x2', visWheelRadius - 10);
        }
    }

    // Update Footer HUD
    if (vis.hudRatio) vis.hudRatio.textContent = `${params.driveGearing.toFixed(2)}:1`;
    if (vis.hudVelocity) vis.hudVelocity.textContent = `${(1 / params.driveGearing).toFixed(2)}x`;
}

// Init
// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateUI);
} else {
    updateUI();
}
