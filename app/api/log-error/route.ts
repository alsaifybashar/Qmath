import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        console.log('\n\x1b[41m\x1b[37m ================= BROWSER CAUGHT ERROR ================= \x1b[0m');
        console.log(`\x1b[31m💥 Type:\x1b[0m    ${body.type}`);
        console.log(`\x1b[34m🔗 URL:\x1b[0m     ${body.url}`);

        if (body.source && body.source !== 'unknown') {
            console.log(`\x1b[33m📁 Source:\x1b[0m  ${body.source}:${body.lineno}:${body.colno}`);
        }

        console.log(`\x1b[37m💬 Message:\x1b[0m\n${body.message}`);

        if (body.stack) {
            console.log(`\x1b[90m📚 Stacktrace:\n${body.stack}\x1b[0m`);
        }
        console.log('\x1b[41m\x1b[37m ======================================================== \x1b[0m\n');

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process log' }, { status: 500 });
    }
}
