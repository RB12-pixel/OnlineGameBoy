export class PPU {
    constructor(mmu, canvas) {
        this.mmu = mmu;
        this.ctx = canvas.getContext('2d');
        this.imgData = this.ctx.createImageData(160, 144);
        this.colors = [
            [155, 188, 15],
            [139, 172, 15],
            [48, 98, 48],
            [15, 56, 15]
        ];
        this.scanlineCounter = 456; 
        this.line = 0;
    }

    update(cycles) {
        this.scanlineCounter -= cycles;
        if (this.scanlineCounter <= 0) {
            this.scanlineCounter += 456;
            this.line = (this.line + 1) % 154;
            this.mmu.write8(0xFF44, this.line);

            if (this.line === 144) {
                this.renderFrame();
            }
        }
    }

    renderFrame() {
        const lcdc = this.mmu.read8(0xFF40);
        const lcdEnabled = (lcdc & 0x80) !== 0;

        if (!lcdEnabled) {
            this.ctx.fillStyle = "#9bbc0f";
            this.ctx.fillRect(0, 0, 160, 144);
            return;
        }

        let dataIdx = 0;
        for (let y = 0; y < 144; y++) {
            for (let x = 0; x < 160; x++) {
                const tileX = Math.floor(x / 8);
                const tileY = Math.floor(y / 8);
                const tileIndex = tileY * 32 + tileX;

                const bgMapAddr = (lcdc & 0x08) ? 0x9C00 : 0x9800;
                const tileMapEntry = this.mmu.read8(bgMapAddr + tileIndex - 0x8000);

                let tileAddr;
                if (lcdc & 0x10) {
                    tileAddr = 0x8000 + (tileMapEntry * 16);
                } else {
                    let signedIndex = (tileMapEntry < 128) ? tileMapEntry : tileMapEntry - 256;
                    tileAddr = 0x9000 + (signedIndex * 16);
                }

                const line = (y % 8) * 2;
                const vramOffset1 = (tileAddr + line) - 0x8000;
                const vramOffset2 = (tileAddr + line + 1) - 0x8000;

                const byte1 = this.mmu.vram[vramOffset1 & 0x1FFF] || 0;
                const byte2 = this.mmu.vram[vramOffset2 & 0x1FFF] || 0;

                const bit = 7 - (x % 8);
                const pixelColor = (((byte2 >> bit) & 1) << 1) | ((byte1 >> bit) & 1);
                const color = this.colors[pixelColor];

                this.imgData.data[dataIdx] = color[0];
                this.imgData.data[dataIdx + 1] = color[1];
                this.imgData.data[dataIdx + 2] = color[2];
                this.imgData.data[dataIdx + 3] = 255;
                dataIdx += 4;
            }
        }
        this.ctx.putImageData(this.imgData, 0, 0);
    }
}
