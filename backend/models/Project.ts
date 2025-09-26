import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsUrl, IsNumber, Min } from 'class-validator';
import { User } from './User';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, user => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column()
  @IsNotEmpty()
  owner!: string;

  @Column()
  @IsNotEmpty()
  name!: string;

  @Column()
  @IsUrl()
  url!: string;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  stars!: number;

  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  forks!: number;

  @Column({ name: 'open_issues', default: 0 })
  @IsNumber()
  @Min(0)
  openIssues!: number;

  @Column({ name: 'github_created_at', type: 'bigint' })
  @IsNumber()
  githubCreatedAt!: number; // Unix timestamp from GitHub

  @Column({ type: 'jsonb', nullable: true, name: 'github_data' })
  githubData?: any; // Store additional GitHub API response data

  @Column({ name: 'last_updated_from_github', nullable: true })
  lastUpdatedFromGithub?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
