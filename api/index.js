const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const matter  = require('gray-matter');
const multer  = require('multer');

const app  = express();
const PORT = process.env.PORT || 3001;

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
    const contentPath = path.join(__dirname, '../content');
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
    const filePath = path.join(__dirname, '../content', `${postId}.md`);
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
    const { titulo, contenido } = req.body;
    const imagenName = req.file ? req.file.filename : null;

    const fecha = new Date().toISOString().split('T')[0];

    const id = titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const filePath = path.join(__dirname, '../content', `${id}.md`);

    const mdContent = `---
    titulo: "${titulo}"
    fecha: "${fecha}"
    imagen: "${imagenName}"
    ---
    ${contenido}`;

    fs.writeFileSync(filePath, mdContent);
    res.json( {message: 'Noticia publicada con exito', id });
});

app.delete('/api/posts/:id', (req, res) => {
    const postId = req.params.id;
    const filePath = path.join(__dirname, '../content', `${postId}.md`);
    if(fs.existsSync(filePath)){
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data } = matter(fileContent);

        if(data.imagen){
            const imgPath = path.join(__dirname, '../public/img', data.imagen);
            if(fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }
        fs.unlinkSync(filePath);
        res.json({ message: 'Noticia eliminada correctamente' });
    }else{
        res.status(404).json({ error: 'Noticia no encontrada' });
    }
});

app.put('/api/posts/:id', upload.single('imagen'), (req, res) => {
    const postId = req.params.id;
    const { titulo, contenido, imagenActual } = req.body;
    const filePath = path.join(__dirname, '../content', `${postId}.md`);
    if(!fs.existsSync(filePath)) return res.status(404).json({ error: 'Noticia no encontrada' });
    
    const existingContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(existingContent);
    const fecha = data.fecha;

    let imagenName = imagenActual;
    if(req.file){
        imagenActual = req.file.filename;
        if(imagenActual && imagenActual !== 'null'){
            const oldImgPath = path.join(__dirname, '../public/img', imagenActual);
            if(fs.existsSync(oldImgPath)) fs.unlinkSync(oldImgPath);
        }
    }
    const mdContent = `---
    titulo: "${titulo}"
    fecha: "${fecha}"
    imagen: "${imagenName || ''}"
    ---
    ${contenido}`;
    fs.writeFileSync(filePath, mdContent);
    res.json({ message: 'Noticia actualizada con exito' });
});

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor de la API corriendo en http://localhost:${PORT}`);
});