// app/api/scan/_python.ts
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

const PYTHON_TIMEOUT_MS = 25_000

export type PythonJsonResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function getPythonCommand(scriptPath: string): { cmd: string; args: string[] } {
  console.log('\n🔍 [getPythonCommand] Looking for Python...')
  console.log(`   Current working directory: ${process.cwd()}`)
  console.log(`   Script path: ${scriptPath}`)
  
  // PRIORITY 1: Check for virtual environment in project
  const venvPaths = [
    path.join(process.cwd(), '.venv', 'Scripts', 'python.exe'),
    path.join(process.cwd(), 'venv', 'Scripts', 'python.exe'),
    path.join(process.cwd(), '.venv', 'bin', 'python'),
    path.join(process.cwd(), 'venv', 'bin', 'python'),
  ]
  
  for (const venvPath of venvPaths) {
    console.log(`   Checking venv path: ${venvPath}`)
    if (fs.existsSync(venvPath)) {
      console.log(`✅ Using venv Python: ${venvPath}`)
      return { cmd: venvPath, args: [scriptPath] }
    } else {
      console.log(`   ❌ Not found: ${venvPath}`)
    }
  }
  
  // PRIORITY 2: Check environment variable
  console.log(`   Checking PYTHON_PATH env var: ${process.env.PYTHON_PATH || 'not set'}`)
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    console.log(`✅ Using Python from env: ${process.env.PYTHON_PATH}`)
    return { cmd: process.env.PYTHON_PATH, args: [scriptPath] }
  } else if (process.env.PYTHON_PATH) {
    console.log(`   ❌ PYTHON_PATH set but file not found: ${process.env.PYTHON_PATH}`)
  }
  
  // PRIORITY 3: Try common Windows Python paths
  const commonPaths = [
    'python',
    'python3',
    'py',
    'C:\\Python311\\python.exe',
    'C:\\Python310\\python.exe',
    'C:\\Python39\\python.exe',
    'C:\\Python38\\python.exe',
    process.env.LOCALAPPDATA + '\\Programs\\Python\\Python311\\python.exe',
    process.env.LOCALAPPDATA + '\\Programs\\Python\\Python310\\python.exe',
    process.env.LOCALAPPDATA + '\\Programs\\Python\\Python39\\python.exe',
    'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Microsoft\\WindowsApps\\python.exe',
    'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Microsoft\\WindowsApps\\python3.exe',
  ]
  
  for (const pyPath of commonPaths) {
    if (pyPath === 'python' || pyPath === 'python3' || pyPath === 'py') {
      console.log(`   Trying command: ${pyPath}`)
      // For commands, we'll let the system try
      console.log(`⚠️ Using system Python command: ${pyPath}`)
      return { cmd: pyPath, args: [scriptPath] }
    }
    console.log(`   Checking common path: ${pyPath}`)
    if (fs.existsSync(pyPath)) {
      console.log(`✅ Using Python from common path: ${pyPath}`)
      return { cmd: pyPath, args: [scriptPath] }
    }
  }
  
  // FINAL FALLBACK
  console.log('❌ No Python found in any location!')
  if (process.platform === 'win32') {
    console.log('⚠️ Final fallback: using "python" command')
    return { cmd: 'python', args: [scriptPath] }
  }
  console.log('⚠️ Final fallback: using "python3" command')
  return { cmd: 'python3', args: [scriptPath] }
}

/** Runs training/*.py scripts that read one JSON line from stdin and print one JSON line. */
export function runPythonJsonScript<T extends Record<string, unknown>>(
  scriptRelative: string,
  stdinPayload: unknown
): Promise<PythonJsonResult<T>> {
  const root = path.join(/* turbopackIgnore: true */ process.cwd())
  const scriptPath = path.join(root, scriptRelative)
  const { cmd, args } = getPythonCommand(scriptPath)

  console.log(`\n🐍 [runPythonJsonScript] Executing Python script:`)
  console.log(`   Command: ${cmd}`)
  console.log(`   Args: ${args.join(' ')}`)
  console.log(`   Script path: ${scriptPath}`)
  console.log(`   Script exists: ${fs.existsSync(scriptPath)}`)
  console.log(`   Root directory: ${root}`)

  return new Promise((resolve) => {
    let settled = false
    const finish = (out: PythonJsonResult<T>) => {
      if (settled) return
      settled = true
      console.log(`   Finishing with success: ${out.success}`)
      if (!out.success) {
        console.log(`   Error: ${out.error}`)
      }
      resolve(out)
    }

    console.log(`   Spawning Python process...`)
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUTF8: '1' },
    })

    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      console.log(`   ⏰ Timeout after ${PYTHON_TIMEOUT_MS}ms`)
      child.kill('SIGTERM')
      finish({ success: false, error: 'Python predictor timed out' })
    }, PYTHON_TIMEOUT_MS)

    child.stdout?.on('data', (d: Buffer) => {
      const dataStr = d.toString('utf8')
      stdout += dataStr
      console.log(`   📤 stdout: ${dataStr.substring(0, 100)}${dataStr.length > 100 ? '...' : ''}`)
    })

    child.stderr?.on('data', (d: Buffer) => {
      const dataStr = d.toString('utf8')
      stderr += dataStr
      console.log(`   ⚠️ stderr: ${dataStr.substring(0, 200)}${dataStr.length > 200 ? '...' : ''}`)
    })

    child.on('error', (err) => {
      clearTimeout(timer)
      console.log(`   ❌ Process error: ${err.message}`)
      finish({
        success: false,
        error: err.message.includes('ENOENT')
          ? `Python not found at "${cmd}". Please install Python 3 and add it to PATH, or activate your virtual environment.`
          : err.message,
      })
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      console.log(`   🏁 Process closed with exit code: ${code}`)
      
      if (code !== 0) {
        console.log(`   ⚠️ Non-zero exit code: ${code}`)
        if (stderr) {
          console.log(`   stderr content: ${stderr}`)
        }
      }
      
      const lines = stdout.trim().split(/\r?\n/).filter(Boolean)
      const line = lines.pop() ?? ''
      console.log(`   📄 Last output line: ${line.substring(0, 200)}${line.length > 200 ? '...' : ''}`)
      
      if (!line) {
        console.log(`   ❌ No output line found`)
        finish({
          success: false,
          error: stderr.trim() || `predictor exited ${code} with no output`,
        })
        return
      }
      
      try {
        const parsed = JSON.parse(line) as { ok?: boolean; error?: string } & T
        console.log(`   ✅ Successfully parsed JSON`)
        if (parsed && parsed.ok === false) {
          console.log(`   ❌ Python script returned ok=false: ${parsed.error}`)
          finish({ success: false, error: parsed.error ?? 'predictor error' })
          return
        }
        finish({ success: true, data: parsed as T })
      } catch (err) {
        console.log(`   ❌ JSON parse error: ${err}`)
        console.log(`   Raw output that failed to parse: ${stdout.substring(0, 500)}`)
        finish({ success: false, error: 'invalid JSON from predictor' })
      }
    })

    const inputStr = JSON.stringify(stdinPayload) + '\n'
    console.log(`   📝 Writing to stdin: ${inputStr.substring(0, 100)}${inputStr.length > 100 ? '...' : ''}`)
    child.stdin?.write(inputStr)
    child.stdin?.end()
  })
}