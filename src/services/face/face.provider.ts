/** What every face-analysis backend (mock now, AWS later) must return. */
export interface FaceAnalysis {
    facesDetected: number;
    /** 0 to 1 (an adapter whose service returns 0-100 must divide by 100). */
    confidence: number;
    /** "male" / "female" / null when no face was found. */
    gender: string | null;
}

export interface FaceProvider {
    /** Looks at the image bytes and reports what it sees. The image is never stored. */
    analyze(image: Buffer): Promise<FaceAnalysis>;
}