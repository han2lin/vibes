
import { SimulationParams, SimulationResult } from './types';

const GRAVITY = 9.80665;
const UNITS = {
  rpmToRadsPerSec: (rpm: number) => (rpm * 2 * Math.PI) / 60,
};

export class DCMotor {
  public nominalVoltageVolts: number;
  public stallTorqueNM: number;
  public stallCurrentAmps: number;
  public freeCurrentAmps: number;
  public freeSpeedRadPerSec: number;
  public rOhms: number;
  public kVRadPerSecPerVolt: number;
  public kTNMPerAmp: number;

  constructor(
    nominalVoltageVolts: number,
    stallTorqueNM: number,
    stallCurrentAmps: number,
    freeCurrentAmps: number,
    freeSpeedRadPerSec: number,
    numMotors: number
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

  static getNeoVortex(numMotors: number): DCMotor {
    return new DCMotor(12, 3.6, 211, 3.6, UNITS.rpmToRadsPerSec(6784), numMotors);
  }

  getCurrent(speedRadPerSec: number, voltage: number): number {
    return (
      (-1.0 / this.kVRadPerSecPerVolt / this.rOhms) * speedRadPerSec +
      (1.0 / this.rOhms) * voltage
    );
  }

  getTorque(currentAmps: number): number {
    return currentAmps * this.kTNMPerAmp;
  }

  withReduction(gearboxReduction: number): DCMotor {
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

export function calculateMaxAccel(params: SimulationParams): SimulationResult {
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
  // Logic from provided code: (1.2 * (mass * 9.8)) / numModules
  const moduleFrictionForce = (1.2 * (mass * GRAVITY)) / numModules;

  // Max current available at stall (starting from 0 speed)
  const maxCurrent = Math.min(driveMotor.getCurrent(0.0, 12.0), currentLimit * numMotors);

  // Theoretical max torque available at wheels
  const maxTorque = maxCurrent * driveMotor.kTNMPerAmp - torqueLoss;
  
  // Force exerted at the ground
  const motorForce = maxTorque / wheelRadius;

  // Actual force is limited by traction
  const maxForce = Math.min(motorForce, moduleFrictionForce);

  let limitingFactor: SimulationResult['limitingFactor'] = 'None';
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
