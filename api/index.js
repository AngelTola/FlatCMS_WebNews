const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const matter  = require('gray-matter');
const multer  = require('multer');

const app  = express();
const PORT = process.env.PORT || 3001;

const contentPath = path.join(__dirname, '../content');
const imgPathDir = path.join(__dirname, '../public/img');
if (!fs.existsSync(contentPath)) fs.mkdirSync(contentPath, { recursive: true });
if (!fs.existsSync(imgPathDir)) fs.mkdirSync(imgPathDir, { recursive: true });

app.use(cors());
app.use(express.json());

app.use('/img', express.static(path.join(__dirname, '../public/img')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/img'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});
const upload = multer({ storage });

app.get('/api/posts', (req, res) => {
    fs.readdir(contentPath, (err, files) => {
        if(err){
            return res.status(500).json({ error: 'No se pudo leer la carpeta de content'});
        }
        const mdFiles = files.filter(file => file.endsWith('.md'));

        const posts = mdFiles.map(filename => {
            const filePath = path.join(contentPath, filename);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const { data, content } = matter(fileContent);

            return {
                id: filename.replace('.md', ''),
                titulo: data.titulo || 'Noticia sin titulo',
                fecha: data.fecha || 'Sin fecha',
                imagen: data.imagen || null,
                resumen: content.substring(0, 120) + '...',
            };
        });
        posts.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        res.json({ posts });
    });
});

app.get('/api/posts/:id', (req, res) => {
    const postId   = req.params.id;
    const filePath = path.join(contentPath, `${postId}.md`);
    if(fs.existsSync(filePath)){
        const fileContent       = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);
        res.json({
            id: postId,
            titulo: data.titulo || 'Sin titulo',
            fecha: data.fecha || '',
            imagen: data.imagen || null,
            contenido: content
        });
    }else{
        res.status(404).json({ error: 'Noticia no encontrada' });
    }
});

app.post('/api/posts', upload.single('imagen'), (req, res) => {
    try {
        const { titulo, contenido } = req.body;
        const imagenName = req.file ? req.file.filename : null;

        const fecha = new Date().toISOString().split('T')[0];

        const id = titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
        const filePath = path.join(contentPath, `${id}.md`);

        const mdContent = `---\ntitulo: "${titulo}"\nfecha: "${fecha}"\nimagen: "${imagenName || ''}"\n---\n${contenido}`;

        fs.writeFileSync(filePath, mdContent);
        res.json({ message: 'Noticia publicada con exito', id });
    } catch (error) {
        console.error("Error al publicar:", error);
        res.status(500).json({ error: 'Error interno al guardar la noticia' });
    }
});

app.delete('/api/posts/:id', (req, res) => {
    try {
        const postId = req.params.id;
        const filePath = path.join(contentPath, `${postId}.md`);
        
        if(fs.existsSync(filePath)){
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const { data } = matter(fileContent);

            if(data.imagen && data.imagen !== 'null'){
                const imgPath = path.join(imgPathDir, data.imagen);
                if(fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }
            fs.unlinkSync(filePath);
            res.json({ message: 'Noticia eliminada correctamente' });
        } else {
            res.status(404).json({ error: 'Noticia no encontrada' });
        }
    } catch(error) {
        console.error("Error al eliminar:", error);
        res.status(500).json({ error: 'Error interno al eliminar la noticia' });
    }
});

app.put('/api/posts/:id', upload.single('imagen'), (req, res) => {
    try {
        const postId = req.params.id;
        const { titulo, contenido, imagenActual } = req.body;
        const filePath = path.join(contentPath, `${postId}.md`);
        
        if(!fs.existsSync(filePath)) return res.status(404).json({ error: 'Noticia no encontrada' });
        
        const existingContent = fs.readFileSync(filePath, 'utf-8');
        const { data } = matter(existingContent);
        const fecha = data.fecha;

        let imagenName = imagenActual; 

        if(req.file){
            imagenName = req.file.filename;
            
            if(imagenActual && imagenActual !== 'null'){
                const oldImgPath = path.join(imgPathDir, imagenActual);
                if(fs.existsSync(oldImgPath)) fs.unlinkSync(oldImgPath);
            }
        }

        const mdContent = `---\ntitulo: "${titulo}"\nfecha: "${fecha}"\nimagen: "${imagenName || ''}"\n---\n${contenido}`;
        
        fs.writeFileSync(filePath, mdContent);
        res.json({ message: 'Noticia actualizada con exito' });
    } catch(error) {
        console.error("Error al actualizar:", error);
        res.status(500).json({ error: 'Error interno al actualizar la noticia' });
    }
});

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor de la API corriendo en el puerto ${PORT}`);
});