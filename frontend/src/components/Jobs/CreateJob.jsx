import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../../../assets/bg5.jpg'; // Adjust the path as necessary
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  CardActions,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

const CreateJob = () => {
  const [job, setJob] = useState({
    title: '',
    description: '',
    requirements: [],
    budget: '',
    deadline: '',
  });

  const [requirement, setRequirement] = useState('');

  const handleChange = (e) => {
    setJob({ ...job, [e.target.name]: e.target.value });
  };

  const handleRequirementChange = (e) => {
    setRequirement(e.target.value);
  };

  const addRequirement = () => {
    if (requirement.trim()) {
      setJob({ ...job, requirements: [...job.requirements, requirement] });
      setRequirement('');
    }
  };

  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/user/job/create-job', job);
      console.log(response.data);
      navigate('/JobList');
      // Optionally, reset the form or show a success message
    } catch (error) {
      console.error(error);
    }
  };

  // Styles for the background
  const backgroundStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'fixed', // Changed to fixed to cover the whole screen
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: '100vh',
    zIndex: -1,
  };

  // Styles for the content container
  const contentStyle = {
    marginTop: '2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slightly less transparent for better visibility
    padding: '2rem',
    borderRadius: '10px',
    position: 'relative', // Positioned relative to overlay above the background
    zIndex: 1,
  };

  return (
    <div style={backgroundStyle}>
      <Container style={contentStyle}>
        <Typography variant="h4" align="center" gutterBottom style={{ color: 'black', fontFamily: 'fantasy' }}>
          Create Job
        </Typography>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <TextField
            name="title"
            value={job.title}
            onChange={handleChange}
            placeholder="Job Title"
            required
            variant="outlined"
            margin="normal"
            style={{ width: '100%', margin: '10px 0' }}
          />
          <TextField
            name="description"
            value={job.description}
            onChange={handleChange}
            placeholder="Job Description"
            required
            variant="outlined"
            margin="normal"
            multiline
            rows={4}
            style={{ width: '100%', margin: '10px 0' }}
          />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              value={requirement}
              onChange={handleRequirementChange}
              placeholder="Add Requirement"
              variant="outlined"
              margin="normal"
              style={{ flex: 1, margin: '10px 0' }}
            />
            <Button variant="contained" color="primary" onClick={addRequirement} style={{ marginLeft: '10px' }}>
              Add
            </Button>
          </div>
          <List style={{ listStyleType: 'none', padding: '0' }}>
            {job.requirements.map((req, index) => (
              <ListItem key={index} style={{ backgroundColor: '#e0e0e0', margin: '5px 0', borderRadius: '4px' }}>
                <ListItemText primary={req} />
              </ListItem>
            ))}
          </List>
          <TextField
            name="budget"
            value={job.budget}
            onChange={handleChange}
            placeholder="Budget"
            required
            variant="outlined"
            margin="normal"
            style={{ width: '100%', margin: '10px 0' }}
          />
          <TextField
            name="deadline"
            value={job.deadline}
            onChange={handleChange}
            type="date"
            required
            variant="outlined"
            margin="normal"
            style={{ width: '100%', margin: '10px 0' }}
          />
          <CardActions style={{ justifyContent: 'center' }}>
            <Button type="submit" variant="contained" color="primary">
              Add Job
            </Button>
          </CardActions>
        </form>
      </Container>
    </div>
  );
};

export default CreateJob;
