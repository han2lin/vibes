
const GRAVITY = 9.80665;
const UNITS = {
    rpmToRadsPerSec: (rpm) => (rpm * 2 * Math.PI) / 60,
};

class DCMotor {
    constructor(
        nominalVoltageVolts,
        stallTorqueNM,
        stallCurrentAmps,
        freeCurrentAmps,
        freeSpeedRadPerSec,
        numMotors
    ) {
        this.nominalVoltageVolts = nominalVoltageVolts;
        this.stallTorqueNM = stallTorqueNM * numMotors;
        this.stallCurrentAmps = stallCurrentAmps * numMotors;
        this.freeCurrentAmps = freeCurrentAmps * numMotors;
        this.rOhms = nominalVoltageVolts / this.stallCurrentAmps;
        this.kTNMPerAmp = this.stallTorqueNM / this.stallCurrentAmps;
        this.freeSpeedRadPerSec = freeSpeedRadPerSec;
        this.kVRadPerSecPerVolt =
            freeSpeedRadPerSec / (nominalVoltageVolts - this.rOhms * this.freeCurrentAmps);
    }

    static getNeoVortex(numMotors) {
        return new DCMotor(12, 3.6, 211, 3.6, UNITS.rpmToRadsPerSec(6784), numMotors);
    }

    getCurrent(speedRadPerSec, voltage) {
        return (
            (-1.0 / this.kVRadPerSecPerVolt / this.rOhms) * speedRadPerSec +
            (1.0 / this.rOhms) * voltage
        );
    }

    getTorque(currentAmps) {
        return currentAmps * this.kTNMPerAmp;
    }

    withReduction(gearboxReduction) {
        return new DCMotor(
            this.nominalVoltageVolts,
            this.stallTorqueNM * gearboxReduction,
            this.stallCurrentAmps,
            this.freeCurrentAmps,
            this.freeSpeedRadPerSec / gearboxReduction,
            1
        );
    }
}

function calculateMaxAccel(params) {
    const { wheelRadius, driveGearing, maxDriveSpeed, currentLimit } = params;
    const mass = 22; // kg
    const numModules = 4;
    const numMotors = 1;

    const driveMotor = DCMotor.getNeoVortex(numMotors).withReduction(driveGearing);

    // Current at top speed
    const maxVelCurrent = Math.min(
        driveMotor.getCurrent(maxDriveSpeed / wheelRadius, 12.0),
        currentLimit * numMotors
    );

    // Torque loss due to back-EMF at speed
    const torqueLoss = Math.max(driveMotor.getTorque(maxVelCurrent), 0.0);

    // Friction limit (traction)
    const moduleFrictionForce = (1.2 * (mass * GRAVITY)) / numModules;

    // Max current available at stall (starting from 0 speed)
    const maxCurrent = Math.min(driveMotor.getCurrent(0.0, 12.0), currentLimit * numMotors);

    // Theoretical max torque available at wheel
    const maxTorque = maxCurrent * driveMotor.kTNMPerAmp - torqueLoss;

    // Force exerted at the ground
    const motorForce = maxTorque / wheelRadius;

    // Actual force is limited by traction
    const maxForce = Math.min(motorForce, moduleFrictionForce);

    let limitingFactor = 'None';
    if (moduleFrictionForce < motorForce) {
        limitingFactor = 'Traction';
    } else if (maxCurrent === currentLimit * numMotors) {
        limitingFactor = 'Current Limit';
    } else {
        limitingFactor = 'Motor Torque';
    }

    const maxAccel = maxForce > 0 ? (maxForce * numModules) / mass : 0.0;

    return {
        maxAccel,
        limitingFactor,
        maxForce,
        tractionLimit: moduleFrictionForce,
        motorTorqueForce: motorForce
    };
}

// Expose to window for global access
window.calculateMaxAccel = calculateMaxAccel;
window.DCMotor = DCMotor;
