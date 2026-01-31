import { GoogleGenAI, Type } from "@google/genai";
import { SimulationParams, SimulationResult } from './types';

export async function getEducationalInsight(params: SimulationParams, result: SimulationResult): Promise<string> {
  // Use the mandatory named parameter for apiKey obtained from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Context: A student is simulating a robot's drivetrain.
    Parameters:
    - Wheel Radius: ${params.wheelRadius}m
    - Gearing: ${params.driveGearing}:1
    - Max Speed: ${params.maxDriveSpeed}m/s
    - Current Limit: ${params.currentLimit}A
    
    Simulation Result:
    - Max Acceleration: ${result.maxAccel.toFixed(2)} m/s^2
    - Limiting Factor: ${result.limitingFactor}
    - Calculated Motor Force: ${result.motorTorqueForce.toFixed(2)}N
    - Traction Limit: ${result.tractionLimit.toFixed(2)}N

    Task: Explain to the student WHY their acceleration is ${result.maxAccel.toFixed(2)} m/s^2 and how the current limiting factor (${result.limitingFactor}) works. 
    Focus on the trade-offs of gearing (High vs Low) and wheel size. 
    Keep it short and under 3 sentences.
  `;

  try {
    // Select gemini-3-pro-preview for complex reasoning and STEM tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    // Access response.text property directly as per latest SDK guidelines
    return response.text || "Could not generate insight at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The laws of physics are complex! Check your gearing and current limits to optimize performance.";
  }
}