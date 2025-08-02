// index.js

// Import library yang diperlukan dari Genkit
import { defineFlow, run, startFlow } from '@genkit-ai/flow';
import { geminiPro } from '@genkit-ai/google-cloud';
import { z } from 'zod';
import { generate } from '@genkit-ai/dotprompt';
import dotenv from 'dotenv';

// Muat variabel lingkungan dari file .env
dotenv.config();

// --- PENGATURAN MODEL DAN "PERSONA" ---
// Inisialisasi model Gemini Pro
export const model = geminiPro;

// Prompt untuk menyuntikkan persona "Tukang Ojek Digital"
// Ini adalah instruksi yang akan diberikan ke model AI
const ojekPersonaPrompt = generate({
    model,
    prompt: `
    Kamu adalah seorang "Tukang Ojek Digital" yang ramah dan sedikit "sok tahu" tapi jujur.
    Jawablah setiap pertanyaan dengan gaya bahasa sehari-hari khas tukang ojek di Jakarta:
    - Gunakan sapaan seperti "Mas," "Mbak," atau "Bang."
    - Sampaikan nasihat dengan santai.
    - Gunakan ungkapan seperti "Wah," "Kayaknya sih," "Mending gini aja deh."
    - Respons tidak perlu terlalu formal atau panjang lebar.
    - Jika diberi informasi dari 'tools', gunakan informasi tersebut dalam jawabanmu.

    Contoh gaya bahasa:
    Pertanyaan: Hari ini cuaca di Jakarta gimana?
    Jawaban: Wah, mendung nih, Mas. Kayaknya bentar lagi hujan deras. Mending bawa payung. Jangan sampai masuk angin.

    ---
    Pertanyaan: {{input}}
    `
});

// --- DEFINISI "TOOLS" (ALAT) ---
// Kita akan menggunakan tools sederhana karena ini untuk hackathon

// 1. Tool untuk cek cuaca (data dummy)
export const checkWeatherTool = {
    name: 'checkWeather',
    description: 'Mengecek kondisi cuaca saat ini di Jakarta.',
    inputSchema: z.object({}), // Tidak butuh input, karena lokasinya sudah fix (Jakarta)
    outputSchema: z.string(),
    // Fungsi yang akan dijalankan oleh tool
    execute: async () => {
        const weatherConditions = [
            'panas terik',
            'mendung, kayaknya mau hujan',
            'hujan deras',
            'angin kencang',
        ];
        // Pilih kondisi cuaca secara acak
        return weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    },
};

// 2. Tool untuk tahu waktu (data dummy)
export const getTimeTool = {
    name: 'getTime',
    description: 'Memberi tahu waktu saat ini dalam format jam:menit.',
    inputSchema: z.object({}),
    outputSchema: z.string(),
    execute: async () => {
        const now = new Date();
        // Kembalikan waktu saat ini dengan format lokal
        return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    },
};

// --- DEFINISI "FLOW" UTAMA ---
// Flow ini adalah alur kerja utama agent.
export const digitalOjekFlow = defineFlow(
    {
        name: 'digitalOjekFlow',
        inputSchema: z.string(), // Input dari pengguna adalah string
        outputSchema: z.string(), // Output ke pengguna juga string
        tools: [checkWeatherTool, getTimeTool], // Daftarkan tools yang bisa dipakai agent
    },
    async (input) => {
        // Jalankan prompt yang sudah kita buat dengan persona
        const response = await ojekPersonaPrompt.generate({ input });

        // Kembalikan respons dari agent
        return response.text();
    }
);

// --- UNTUK MENJALANKAN DI KONSOL (OPSIONAL) ---
// Kode di bawah ini hanya untuk demo
if (require.main === module) {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const runFlow = async (question) => {
        try {
            const flowResponse = await startFlow(digitalOjekFlow, question);
            console.log(`\nTukang Ojek: ${flowResponse.result}`);
        } catch (error) {
            console.error('Ada masalah, Mas!', error);
        }
    };

    const askQuestion = () => {
        readline.question('\nKamu: ', async (input) => {
            if (input.toLowerCase() === 'exit') {
                readline.close();
                return;
            }
            await runFlow(input);
            askQuestion(); // Ulangi untuk pertanyaan berikutnya
        });
    };

    console.log("Chatbot Tukang Ojek siap! Ketik 'exit' untuk keluar.");
    askQuestion();
}