import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoFeedToggle } from './VideoFeedToggle';
import * as videoPreferences from '../util/videoPreferences';

// Mock the videoPreferences module
vi.mock('../util/videoPreferences', () => ({
    getVideoFeedType: vi.fn(() => 'mjpeg'),
    getAudioEnabled: vi.fn(() => false),
    saveVideoFeedType: vi.fn(),
    saveAudioEnabled: vi.fn(),
}));

describe('VideoFeedToggle', () => {
    const mockOnFeedTypeChange = vi.fn();
    const mockOnAudioEnabledChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with default MJPEG selection', () => {
        render(
            <VideoFeedToggle
                onFeedTypeChange={mockOnFeedTypeChange}
                onAudioEnabledChange={mockOnAudioEnabledChange}
            />
        );

        expect(screen.getByText('Video Feed:')).toBeInTheDocument();
        expect(screen.getByText('MJPEG')).toBeInTheDocument();
        expect(screen.getByText('WebRTC+Audio')).toBeInTheDocument();

        // MJPEG button should be active by default
        const mjpegButton = screen.getByText('MJPEG');
        expect(mjpegButton).toHaveClass(/active/);  // Use regex to match CSS modules class
    });

    it('loads saved preferences on mount', () => {
        vi.mocked(videoPreferences.getVideoFeedType).mockReturnValue('webrtc');
        vi.mocked(videoPreferences.getAudioEnabled).mockReturnValue(true);

        render(
            <VideoFeedToggle
                onFeedTypeChange={mockOnFeedTypeChange}
                onAudioEnabledChange={mockOnAudioEnabledChange}
            />
        );

        expect(videoPreferences.getVideoFeedType).toHaveBeenCalled();
        expect(videoPreferences.getAudioEnabled).toHaveBeenCalled();
        expect(mockOnFeedTypeChange).toHaveBeenCalledWith('webrtc');
        expect(mockOnAudioEnabledChange).toHaveBeenCalledWith(true);
    });

    it('switches feed type when button is clicked', () => {
        render(
            <VideoFeedToggle
                onFeedTypeChange={mockOnFeedTypeChange}
                onAudioEnabledChange={mockOnAudioEnabledChange}
            />
        );

        const webrtcButton = screen.getByText('WebRTC+Audio');
        fireEvent.click(webrtcButton);

        expect(videoPreferences.saveVideoFeedType).toHaveBeenCalledWith('webrtc');
        expect(mockOnFeedTypeChange).toHaveBeenCalledWith('webrtc');
    });

    it('shows audio controls when WebRTC is selected', () => {
        vi.mocked(videoPreferences.getVideoFeedType).mockReturnValue('webrtc');
        vi.mocked(videoPreferences.getAudioEnabled).mockReturnValue(false);

        render(
            <VideoFeedToggle
                onFeedTypeChange={mockOnFeedTypeChange}
                onAudioEnabledChange={mockOnAudioEnabledChange}
            />
        );

        // Should show audio control button
        expect(screen.getByText('Audio Off')).toBeInTheDocument();
        expect(screen.getByTitle('Enable Audio')).toBeInTheDocument();
    });

    it('hides audio controls when MJPEG is selected', () => {
        vi.mocked(videoPreferences.getVideoFeedType).mockReturnValue('mjpeg');
        vi.mocked(videoPreferences.getAudioEnabled).mockReturnValue(false);

        render(
            <VideoFeedToggle
                onFeedTypeChange={mockOnFeedTypeChange}
                onAudioEnabledChange={mockOnAudioEnabledChange}
            />
        );

        // Should not show audio controls for MJPEG
        expect(screen.queryByText('Audio Off')).not.toBeInTheDocument();
        expect(screen.queryByText('Audio On')).not.toBeInTheDocument();
    });

    it('toggles audio when audio button is clicked', () => {
        vi.mocked(videoPreferences.getVideoFeedType).mockReturnValue('webrtc');
        vi.mocked(videoPreferences.getAudioEnabled).mockReturnValue(false);

        render(
            <VideoFeedToggle
                onFeedTypeChange={mockOnFeedTypeChange}
                onAudioEnabledChange={mockOnAudioEnabledChange}
            />
        );

        const audioButton = screen.getByTitle('Enable Audio');
        fireEvent.click(audioButton);

        expect(videoPreferences.saveAudioEnabled).toHaveBeenCalledWith(true);
        expect(mockOnAudioEnabledChange).toHaveBeenCalledWith(true);
    });

    it('disables audio when switching to WebRTC if audio is enabled', () => {
        vi.mocked(videoPreferences.getAudioEnabled).mockReturnValue(true);

        render(
            <VideoFeedToggle
                onFeedTypeChange={mockOnFeedTypeChange}
                onAudioEnabledChange={mockOnAudioEnabledChange}
            />
        );

        // Switch to WebRTC
        const webrtcButton = screen.getByText('WebRTC+Audio');
        fireEvent.click(webrtcButton);

        // Should disable audio when switching to WebRTC (per requirements)
        expect(videoPreferences.saveAudioEnabled).toHaveBeenCalledWith(false);
        expect(mockOnAudioEnabledChange).toHaveBeenCalledWith(false);
    });

    it('shows correct audio button states', () => {
        // Test with audio enabled
        vi.mocked(videoPreferences.getVideoFeedType).mockReturnValue('webrtc');
        vi.mocked(videoPreferences.getAudioEnabled).mockReturnValue(true);

        const { unmount } = render(
            <VideoFeedToggle
                onFeedTypeChange={mockOnFeedTypeChange}
                onAudioEnabledChange={mockOnAudioEnabledChange}
            />
        );

        // Should show audio as enabled
        expect(screen.getByText('Audio On')).toBeInTheDocument();
        expect(screen.getByTitle('Mute Audio')).toBeInTheDocument();
        expect(screen.getByText('🔊')).toBeInTheDocument();

        // Clean up first render
        unmount();

        // Test with audio disabled by creating new component instance
        vi.mocked(videoPreferences.getAudioEnabled).mockReturnValue(false);

        render(
            <VideoFeedToggle
                onFeedTypeChange={mockOnFeedTypeChange}
                onAudioEnabledChange={mockOnAudioEnabledChange}
            />
        );

        // Should show audio as disabled
        expect(screen.getByText('Audio Off')).toBeInTheDocument();
        expect(screen.getByTitle('Enable Audio')).toBeInTheDocument();
        expect(screen.getByText('🔇')).toBeInTheDocument();
    });
});