const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;






// Connect to MongoDB
mongoose.connect("mongodb://pagoanalytics-server:mTBD1NdeNJiQcCQznYyl5uGZxGcYF4DhG5hT9gp54rylNJxwRl1wxefJ3UF9OPNMmB5tOXJubsZiACDbzHLfnA==@pagoanalytics-server.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@pagoanalytics-server@")
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });



// ----------------------------------------JOBS posting Display api-----------------------
const { BlobServiceClient } = require("@azure/storage-blob");

const azureStorageConnectionString = "DefaultEndpointsProtocol=https;AccountName=surveyappanswers;AccountKey=/z7TbEOSeMD/CNN/KrNzhpxbqhaiV620aRfLBLRi9nhhiE4AyN9gAG/MywUOzXWpfOqwNctMSFBF+AStE1wa2g==;EndpointSuffix=core.windows.net";

const blobServiceClient = BlobServiceClient.fromConnectionString(azureStorageConnectionString);

const containerName = "pagoanalyticswebsite";
const containerClient = blobServiceClient.getContainerClient(containerName);

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });



// Define a Mongoose schema for the Grievance collection
const jobsDisplaySchema = new mongoose.Schema({
     date:String,
    title: String,
    status:String,
    Qualifications:String,
    Skills:String,
    positontype:String,
    Location:String,
    iconPath:String
});

const JobsDisplay = mongoose.model('JobsDisplay', jobsDisplaySchema);

// Create an API endpoint for posting grievances
app.post('/post-job', upload.single('image'), async (req, res) => {
  try {
    const {date, title, status,Qualifications,Skills,positontype,Location } = req.body;
    const imageData = req.file.buffer;
    const contentType = req.file.mimetype;

    const imageFileName = `${Date.now()}_${req.file.originalname}`; // Use a unique name
    const blockBlobClient = containerClient.getBlockBlobClient(imageFileName);

    await blockBlobClient.uploadData(imageData, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    const iconPath = `${containerClient.url}/${imageFileName}`;

    const Job = new JobsDisplay({ date, title, status,Qualifications,Skills,positontype,Location,iconPath});
    await Job.save();

    res.status(201).json({ message: 'Job posted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Create a PUT route to update a job by its ID
app.put('/update-job/:id', async (req, res) => {
  const jobId = req.params.id;
  const {
    date,
    title,
    status,
    Qualifications,
    Skills,
    positontype,
    Location,
    iconPath,
  } = req.body;

  try {
    const updatedJob = await JobsDisplay.findByIdAndUpdate(
      jobId,
      {
        date,
        title,
        status,
        Qualifications,
        Skills,
        positontype,
        Location,
        iconPath,
      },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job updated successfully', updatedJob });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a PUT route to update the status of a job by its ID
app.put('/update-job-status/:id', async (req, res) => {
  const jobId = req.params.id;
  const { status } = req.body; // Only update the 'status' field

  try {
    const updatedJob = await JobsDisplay.findByIdAndUpdate(
      jobId,
      { status },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job status updated successfully', updatedJob });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Create a GET route to fetch all grievances
app.get('/get-jobs', async (req, res) => {
  try {
    const jobs = await JobsDisplay.find();
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a DELETE route to delete all grievances
app.delete('/delete-all-jobs', async (req, res) => {
  try {
    const result = await JobsDisplay.deleteMany({});
    res.json({ message: 'All jobs deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a DELETE route to delete a grievance by its ID
app.delete('/delete-job/:id', async (req, res) => {
  const jobId = req.params.id;

  try {
    const deletedjob = await JobsDisplay.findByIdAndDelete(jobId);

    if (!deletedjob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully', deletedjob });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


// ----------------------------------- applying jobs------------------------------------
const containerName2 = "resumes";
const containerClient2 = blobServiceClient.getContainerClient(containerName2);

// Define a Mongoose schema for the Job Application collection
const jobApplicationSchema = new mongoose.Schema({
  name: String,
  jobTitle: String,
  phone: String,
  email: String,
  city: String,
  resumePath: String, // Store the path to the uploaded resume
  coverLetter: String,
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

// Create an API endpoint for posting job applications
app.post('/post-application', upload.single('resume'), async (req, res) => {
  try {
    const { name, jobTitle, phone, email, city, coverLetter } = req.body;
    const resumeData = req.file.buffer;
    const contentType = req.file.mimetype;

    // Use a unique name for the resume file
    const resumeFileName = `${Date.now()}_${req.file.originalname}`;
    const blockBlobClient = containerClient2.getBlockBlobClient(resumeFileName);

    // Upload the resume to Azure Storage
    await blockBlobClient.uploadData(resumeData, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    // Create a path to the uploaded resume
    const resumePath = `${containerClient2.url}/${resumeFileName}`;

    // Save the job application details in MongoDB
    const jobApplication = new JobApplication({
      name,
      jobTitle,
      phone,
      email,
      city,
      resumePath,
      coverLetter,
    });

    await jobApplication.save();

    res.status(201).json({ message: 'Job application submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/', (req, res) => {
  res.send('Hello, Pago website');
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
