from flask import Flask, render_template, jsonify, Response
import threading
import audio
import head_pose
import detection
import config
import statistics

app = Flask(__name__)

cheating_detected = False
proctoring_threads = {}

def start_proctoring():
    global proctoring_threads
    head_pose_thread = threading.Thread(target=head_pose.pose)
    audio_thread = threading.Thread(target=audio.sound)
    detection_thread = threading.Thread(target=detection.run_detection)
    
    head_pose_thread.daemon = True
    audio_thread.daemon = True
    detection_thread.daemon = True
    
    proctoring_threads['head_pose'] = head_pose_thread
    proctoring_threads['audio'] = audio_thread
    proctoring_threads['detection'] = detection_thread
    
    head_pose_thread.start()
    audio_thread.start()
    detection_thread.start()

def stop_proctoring():
    config.RUNNING.clear()
    for thread in proctoring_threads.values():
        if thread.is_alive():
            thread.join(timeout=1.0)

@app.route('/')
def index():
    if not hasattr(app, 'proctoring_started'):
        start_proctoring()
        app.proctoring_started = True
    return render_template('index.html')

@app.route('/cheat_status')
def cheat_status():
    global cheating_detected
    cheating_detected = detection.GLOBAL_CHEAT
    return jsonify({
        'cheating': cheating_detected,
        'percentage': detection.PERCENTAGE_CHEAT
    })

@app.route('/submit_exam', methods=['POST'])
def submit_exam():
    global cheating_detected
    cheating_detected = False
    # Calculate average cheating percentage
    if detection.CHEAT_PERCENTAGES:
        avg_cheat_percentage = statistics.mean(detection.CHEAT_PERCENTAGES) * 100  # Convert to percentage
    else:
        avg_cheat_percentage = 0.0
    # Log to backend console
    print(f"Exam Submitted - Average Cheating Percentage: {round(avg_cheat_percentage, 2)}%")
    return jsonify({
        'status': 'success',
        'avg_cheat_percentage': round(avg_cheat_percentage, 2)
    })

@app.route('/stop_proctoring', methods=['POST'])
def stop_proctoring_endpoint():
    stop_proctoring()
    return jsonify({'status': 'proctoring_stopped'})

if __name__ == '__main__':
    app.run(debug=True, threaded=True)