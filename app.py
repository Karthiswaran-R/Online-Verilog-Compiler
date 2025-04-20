from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import tempfile
import logging

app = Flask(__name__)
CORS(app)  #Enable CORS for all domains

#Set up logging
logging.basicConfig(level=logging.DEBUG)

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "OK", "message": "Verilog compiler server is up!"})

@app.route('/run', methods=['POST'])
def run_verilog():
    code = request.json.get('code')

    if not code:
        return jsonify({"output": "No Verilog code provided"}), 400

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            filename = f"{tmpdir}/input.v"
            output_exe = f"{tmpdir}/output.out"

            #Write Verilog code to temporary file
            with open(filename, 'w') as f:
                f.write(code)
            logging.info(f"Saved code to {filename}")

            #Compile the Verilog code
            compile_cmd = ['iverilog', '-o', output_exe, filename]
            logging.info(f"Running compile command: {' '.join(compile_cmd)}")
            compile_result = subprocess.run(compile_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            #Use 'vvp' to run the compiled simulation
            result = subprocess.run(['vvp', output_exe], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            output = result.stdout.decode() + result.stderr.decode()

            logging.info(f"Simulation output: {output}")

    except subprocess.CalledProcessError as e:
        output = e.stderr.decode()
        logging.error(f"Compilation or simulation error: {output}")
    except Exception as e:
        output = f"Unexpected error: {str(e)}"
        logging.error(output)

    return jsonify({"output": output})

if __name__ == '__main__':
    app.run(debug=True)