const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const matter  = require('gray-matter');
const multer  = require('multer');

const app  = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/img', express.static(path.join(__dirname, '../public/img')));

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

app.listen(PORT, () => {
    console.log(`Servidor de la API corriendo en http://localhost:${PORT}`);
});