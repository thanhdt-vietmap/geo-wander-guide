import { spawn, ChildProcess } from 'child_process';

const isDev = process.argv.includes('--dev');
const isPreview = process.argv.includes('--preview');

function runCommand(command: string, args: string[], cwd?: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { 
      stdio: 'inherit', 
      shell: true,
      cwd: cwd || process.cwd()
    });
    
    child.on('close', (code) => {
      resolve(code || 0);
    });
  });
}

async function main() {
  if (isDev) {
    console.log('🚀 Starting development servers...');
    
    const vite = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true });
    const server = spawn('npm', ['run', 'dev:server'], { stdio: 'inherit', shell: true });
    
    process.on('SIGINT', () => {
      console.log('\n⏹️  Stopping servers...');
      vite.kill();
      server.kill();
      process.exit();
    });
    
  } else if (isPreview) {
    console.log('🔨 Building for preview...');
    
    const buildCode = await runCommand('npm', ['run', 'build:full']);
    if (buildCode === 0) {
      console.log('✅ Build successful, starting server...');
      await runCommand('npm', ['run', 'start:server']);
    } else {
      console.error('❌ Build failed');
      process.exit(1);
    }
    
  } else {
    console.log('🚀 Starting production server...');
    await runCommand('npm', ['run', 'start:server']);
  }
}

main().catch(console.error);