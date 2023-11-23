package org.javaro.lecture;

public class Student {
	private String name;
	private String studNumber;
	public Student() {
		
	}
	public Student(String studNumber) {this.studNumber =studNumber;}
	public String getName() {
		return this.name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getStudNumber() {
		return this.studNumber;
	}
	public void setStudNumber(String studNumber) {
		this.studNumber = studNumber;
	}
	public String toString() {
		return "학번=" +this.getStudNumber()+",학생이름="+this.getName();
	}
	



}
