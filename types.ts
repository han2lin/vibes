
export interface SimulationParams {
  wheelRadius: number; // meters
  driveGearing: number; // ratio (e.g., 6.75:1)
  maxDriveSpeed: number; // meters per second
  currentLimit: number; // Amps
}

export interface SimulationResult {
  maxAccel: number; // m/s^2
  limitingFactor: 'Traction' | 'Motor Torque' | 'Current Limit' | 'None';
  maxForce: number;
  tractionLimit: number;
  motorTorqueForce: number;
}
